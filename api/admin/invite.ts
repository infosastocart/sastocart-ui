import { query } from "../../src/lib/db";
import { clerkClient } from "@clerk/clerk-sdk-node";

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const { email, permissions } = req.body;

    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    // 1. Send invitation via Clerk
    // The createInvitation method takes an object with emailAddress.
    // Ensure CLERK_SECRET_KEY is set in environment variables.
    const invitation = await clerkClient.invitations.createInvitation({
      emailAddress: email,
      publicMetadata: {
        role: "subadmin",
        permissions: permissions || [],
      },
    });

    // 2. Insert into Neon DB
    // We insert a placeholder ID until they accept and trigger the user.created webhook.
    // The user.created webhook might overwrite this if not careful, so we should handle upsert.
    // Actually, Clerk will create a new user with a specific ID once they sign up via the invite.
    // We can just insert the email, role, and permissions. If the webhook triggers, it'll update the user.
    // Let's use an upsert just in case the email is already in the DB.
    
    await query(`
      INSERT INTO users (id, email, name, role, permissions) 
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (email) 
      DO UPDATE SET role = EXCLUDED.role, permissions = EXCLUDED.permissions
    `, [
      `pending_${Date.now()}`, // Dummy ID for now
      email,
      'Sub Admin',
      'subadmin',
      JSON.stringify(permissions || [])
    ]);

    return res.status(200).json({ success: true, message: "Invitation sent successfully", invitation });
  } catch (error: any) {
    console.error("Error creating invitation:", error);
    return res.status(500).json({ error: error.message || "Internal server error" });
  }
}
