import { query } from "@/lib/db";

export interface CustomerData {
  user_id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  total_orders: number;
  total_spent: number;
}

export async function fetchCustomers(): Promise<CustomerData[]> {
  try {
    const result = await query(`
      SELECT 
        p.id as user_id,
        MAX(o.customer_name) as name,
        p.email as email,
        MAX(o.customer_phone) as phone,
        MAX(o.shipping_address) as address,
        COUNT(o.id) as total_orders,
        SUM(o.total_price) as total_spent
      FROM profiles p
      JOIN orders o ON p.id = o.user_id
      GROUP BY p.id, p.email
      ORDER BY total_spent DESC NULLS LAST
    `);
    
    return result.rows.map((row: any) => ({
      user_id: row.user_id,
      name: row.name || 'Unknown Customer',
      email: row.email || 'No email',
      phone: row.phone || 'N/A',
      address: row.address || 'N/A',
      total_orders: Number(row.total_orders) || 0,
      total_spent: Number(row.total_spent) || 0,
    }));
  } catch (error) {
    console.error("Error fetching customers:", error);
    throw new Error("Failed to fetch customers");
  }
}
