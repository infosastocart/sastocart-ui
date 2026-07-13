import { query } from "@/lib/db";

export interface DashboardMetrics {
  totalSales: number;
  totalOrders: number;
  totalCustomers: number;
  revenueAnalytics: { date: string; revenue: number; orders: number }[];
  topCategories: { name: string; value: number }[];
}

export async function fetchDashboardMetrics(): Promise<DashboardMetrics> {
  try {
    // 1. Total Sales (excluding cancelled/rejected)
    // Assuming status logic includes 'Pending', 'Approved', 'Shipped', 'Delivered'
    const salesResult = await query(`
      SELECT SUM(total_price) as total_sales 
      FROM orders 
      WHERE status != 'Cancelled' AND status != 'Rejected'
    `);
    const totalSales = Number(salesResult.rows[0]?.total_sales) || 0;

    // 2. Total Orders
    const ordersResult = await query(`SELECT COUNT(*) as total_orders FROM orders`);
    const totalOrders = Number(ordersResult.rows[0]?.total_orders) || 0;

    // 3. Total Customers
    // We will attempt to count users from a 'users' or 'profiles' table. If it fails, fallback to distinct order users.
    let totalCustomers = 0;
    try {
      const customersResult = await query(`SELECT COUNT(*) as total_customers FROM users`);
      totalCustomers = Number(customersResult.rows[0]?.total_customers) || 0;
    } catch (e) {
      try {
         const profilesResult = await query(`SELECT COUNT(*) as total_customers FROM profiles`);
         totalCustomers = Number(profilesResult.rows[0]?.total_customers) || 0;
      } catch (err) {
         const distinctUsers = await query(`SELECT COUNT(DISTINCT user_id) as total_customers FROM orders`);
         totalCustomers = Number(distinctUsers.rows[0]?.total_customers) || 0;
      }
    }

    // 4. Revenue Analytics (Last 7 days)
    // We group by date and format it as 'Mon DD' (e.g. 'Aug 13')
    const revenueAnalyticsResult = await query(`
      SELECT 
        TO_CHAR(DATE(created_at), 'Mon DD') as date,
        SUM(total_price) as revenue,
        COUNT(id) as orders,
        DATE(created_at) as raw_date
      FROM orders
      WHERE created_at >= NOW() - INTERVAL '7 days'
        AND status != 'Cancelled' AND status != 'Rejected'
      GROUP BY DATE(created_at), TO_CHAR(DATE(created_at), 'Mon DD')
      ORDER BY raw_date ASC
    `);
    
    const revenueAnalytics = revenueAnalyticsResult.rows.map(r => ({
      date: r.date,
      revenue: Number(r.revenue) || 0,
      orders: Number(r.orders) || 0,
    }));

    // 5. Top Categories
    const topCategoriesResult = await query(`
      SELECT 
        p.category as name,
        SUM(oi.price * oi.quantity) as value
      FROM order_items oi
      JOIN products p ON oi.product_id = p.id
      JOIN orders o ON oi.order_id = o.id
      WHERE o.status != 'Cancelled' AND o.status != 'Rejected'
      GROUP BY p.category
      ORDER BY value DESC
      LIMIT 5
    `);

    const topCategories = topCategoriesResult.rows.map(r => ({
      name: r.name || 'Uncategorized',
      value: Number(r.value) || 0,
    }));

    return {
      totalSales,
      totalOrders,
      totalCustomers,
      revenueAnalytics,
      topCategories,
    };
  } catch (error) {
    console.error("Error fetching dashboard metrics:", error);
    throw new Error("Failed to fetch dashboard metrics");
  }
}
