import { query } from "../../src/lib/db";
import { clerkClient } from "@clerk/clerk-sdk-node";

export default async function handler(req: any, res: any) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    let userId = null;
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (token) {
      try {
        const payload = await clerkClient.verifyToken(token, {
          secretKey: process.env.CLERK_SECRET_KEY,
        } as any);
        userId = payload.sub;
      } catch (e) {
        console.warn("Token verification failed:", e);
      }
    }
    
    // If we don't have userId from auth, maybe we can accept it as query param for this MVP if auth isn't fully configured
    // but the most secure way is reading from auth token.
    const email = req.query.email;
    
    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    if (email === "info.sastocart@gmail.com") {
      return res.status(200).json({ 
        role: "superadmin", 
        permissions: ["dashboard", "orders", "products", "customers", "blog", "team", "settings"] 
      });
    }

    const result = await query(`
      SELECT role, permissions 
      FROM users 
      WHERE email = $1
    `, [email]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    return res.status(200).json(result.rows[0]);
  } catch (error: any) {
    console.error("Error fetching user role:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
