import { query } from './src/lib/db';

async function run() {
  try {
    const res = await query("DELETE FROM users WHERE email = '23ad044@kpriet.ac.in'");
    console.log(`Deleted ${res.rowCount} rows.`);
  } catch (err) {
    console.error("Error deleting user:", err);
  }
  process.exit(0);
}

run();
