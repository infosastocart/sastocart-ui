import { Webhook } from "svix";
import { query } from "../../src/lib/db";

// This is a generic serverless function handler. 
// Depending on your hosting provider (Vercel, Netlify, Cloudflare), you might need to adjust the req/res parsing.
export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET || import.meta.env?.CLERK_WEBHOOK_SECRET;

  if (!WEBHOOK_SECRET) {
    return res.status(500).json({ error: "Please add CLERK_WEBHOOK_SECRET to .env" });
  }

  // Get the headers
  const svix_id = req.headers["svix-id"] as string;
  const svix_timestamp = req.headers["svix-timestamp"] as string;
  const svix_signature = req.headers["svix-signature"] as string;

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return res.status(400).json({ error: "Error occurred -- no svix headers" });
  }

  // Note: svix.verify expects the raw string body.
  // If your framework parses JSON automatically, you might need to stringify it or disable body parsing.
  let payload;
  let rawBody = req.body;
  if (typeof rawBody === "object") {
    rawBody = JSON.stringify(rawBody);
  }

  const wh = new Webhook(WEBHOOK_SECRET);
  let evt: any;

  try {
    evt = wh.verify(rawBody, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    });
  } catch (err) {
    console.error("Error verifying webhook:", err);
    return res.status(400).json({ error: "Error verifying webhook signature" });
  }

  // Process the webhook payload
  const { id } = evt.data;
  const eventType = evt.type;

  if (eventType === "user.created") {
    const email = evt.data.email_addresses?.[0]?.email_address || "";
    const name = `${evt.data.first_name || ""} ${evt.data.last_name || ""}`.trim();
    
    try {
      await query(
        `INSERT INTO users (id, email, name) VALUES ($1, $2, $3)`,
        [id, email, name]
      );
      console.log(`User ${id} successfully synced to Neon.`);
      return res.status(200).json({ success: true, message: "User synced" });
    } catch (err: any) {
      console.error("Error inserting user into Neon DB:", err);
      return res.status(500).json({ error: "Database error" });
    }
  }

  return res.status(200).json({ success: true, message: "Webhook received" });
}
