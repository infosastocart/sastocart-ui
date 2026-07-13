import { Pool } from "@neondatabase/serverless";

// Support both Node (process.env) and Vite (import.meta.env) environments
const connectionString = (typeof process !== 'undefined' && process.env.VITE_NEON_DB_URL) 
  || (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_NEON_DB_URL);

if (!connectionString) {
  console.warn("Missing VITE_NEON_DB_URL environment variable");
}

export const pool = new Pool({ connectionString });

/**
 * Executes a raw SQL query against the Neon database securely.
 * 
 * @param sql The SQL query string
 * @param params Optional array of parameters to substitute into the query
 * @returns The query result object
 */
export async function query(sql: string, params?: any[]) {
  const client = await pool.connect();
  try {
    const result = await client.query(sql, params);
    return result;
  } finally {
    client.release();
  }
}
