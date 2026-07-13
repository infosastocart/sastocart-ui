import { query } from "../../src/lib/db";

export default async function handler(req: any, res: any) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const result = await query(`
      SELECT id, email, name, role, permissions 
      FROM users 
      WHERE role IN ('superadmin', 'subadmin')
    `);

    return res.status(200).json(result.rows);
  } catch (error: any) {
    console.error("Error fetching team:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
