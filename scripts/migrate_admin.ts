import 'dotenv/config';
import { query } from '../src/lib/db';

async function migrateAdmin() {
  const superadminEmail = 'info.sastocart@gmail.com';

  console.log('Starting migration...');

  try {
    // 0. Create users table if not exists
    console.log('Creating users table if not exists...');
    await query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(255) PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        name VARCHAR(255)
      );
    `);

    // 1. Add role column
    console.log('Adding role column...');
    await query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'user';
    `);

    // 2. Add permissions column
    console.log('Adding permissions column...');
    await query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS permissions JSONB DEFAULT '[]'::jsonb;
    `);

    // 3. Upsert superadmin
    console.log('Seeding superadmin...');
    
    const existingUser = await query(`SELECT * FROM users WHERE email = $1`, [superadminEmail]);
    
    if (existingUser.rows.length > 0) {
      await query(`
        UPDATE users 
        SET role = 'superadmin', 
            permissions = '["dashboard", "orders", "products", "customers", "blog", "team", "settings"]'::jsonb 
        WHERE email = $1;
      `, [superadminEmail]);
      console.log(`Updated existing user ${superadminEmail} to superadmin.`);
    } else {
      console.warn(`User ${superadminEmail} not found in DB. Inserting placeholder record...`);
      try {
        const placeholderId = 'pending_superadmin_' + Date.now();
        await query(`
          INSERT INTO users (id, email, name, role, permissions) 
          VALUES ($2, $1, 'Super Admin', 'superadmin', '["dashboard", "orders", "products", "customers", "blog", "team", "settings"]'::jsonb)
        `, [superadminEmail, placeholderId]);
        console.log(`Inserted placeholder superadmin record for ${superadminEmail}.`);
      } catch (insertError: any) {
        console.error("Error inserting placeholder:", insertError.message);
      }
    }

    console.log('Migration completed successfully.');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    process.exit(0);
  }
}

migrateAdmin();
