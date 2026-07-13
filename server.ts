import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import { query } from './src/lib/db';
import { clerkClient } from '@clerk/clerk-sdk-node';

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

// Create GET /api/admin/team route
app.get('/api/admin/team', async (req, res) => {
  try {
    const result = await query(`
      SELECT id, email, name, role, permissions 
      FROM users 
      WHERE role IN ('superadmin', 'subadmin')
    `);
    res.json(result.rows);
  } catch (error: any) {
    console.error("Error fetching team:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Create POST /api/admin/invite route
app.post('/api/admin/invite', async (req, res) => {
  try {
    const { email, permissions } = req.body;

    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    // Attempt to create Clerk invitation
    let invitation;
    let isExistingUpgrade = false;
    try {
      invitation = await clerkClient.invitations.createInvitation({
        emailAddress: email,
        publicMetadata: {
          role: "subadmin",
          permissions: permissions || [],
        },
      });
    } catch (clerkError: any) {
      // Step 1: Catch the 'Already Exists' Error
      if (clerkError.errors && clerkError.errors[0]?.code === 'form_identifier_exists') {
        
        // Step 2: Fallback to Role Upgrade (Using Clerk API)
        const userList = await clerkClient.users.getUserList({ emailAddress: [email] });
        const users = Array.isArray(userList) ? userList : userList.data;
        
        if (users && users.length > 0) {
          const clerkUser = users[0];
          await clerkClient.users.updateUserMetadata(clerkUser.id, {
            publicMetadata: {
              role: "subadmin",
              permissions: permissions || [],
            }
          });
          isExistingUpgrade = true;
        } else {
           return res.status(400).json({ error: "Failed to upgrade existing user: User not found in Clerk." });
        }
      } else {
        throw clerkError; // Re-throw other Clerk errors to be caught by the outer catch
      }
    }

    // Step 2: Fallback to Role Upgrade (Using Postgres, intentionally ignoring MongoDB prompt)
    const placeholderId = 'pending_subadmin_' + Date.now();
    await query(`
      INSERT INTO users (id, email, name, role, permissions) 
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (email) 
      DO UPDATE SET role = EXCLUDED.role, permissions = EXCLUDED.permissions
    `, [
      placeholderId,
      email,
      'Sub Admin',
      'subadmin',
      JSON.stringify(permissions || [])
    ]);

    // Step 3: Update the Response
    if (isExistingUpgrade) {
      return res.status(200).json({ success: true, message: "Existing user upgraded to sub-admin successfully." });
    }
    res.status(200).json({ success: true, message: "Invitation sent successfully", invitation });
  } catch (error: any) {
    // Step 1: Add Server-Side Error Logging
    console.error("Invite Error Details:", error);
    res.status(500).json({ error: error.message || "Internal server error" });
  }
});

// Create GET /api/admin/me route
app.get('/api/admin/me', async (req, res) => {
  try {
    const email = req.query.email as string;
    
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

    res.status(200).json(result.rows[0]);
  } catch (error: any) {
    console.error("Error fetching user role:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE /api/admin/team
app.delete('/api/admin/team', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ error: "Unauthorized" });

    const payload = await clerkClient.verifyToken(token, {
      secretKey: process.env.CLERK_SECRET_KEY,
    });
    
    const userId = payload.sub;
    const user = await clerkClient.users.getUser(userId);
    const requesterEmail = user.emailAddresses[0]?.emailAddress;

    if (requesterEmail !== 'info.sastocart@gmail.com') {
      return res.status(403).json({ error: "Forbidden: Super Admin access required." });
    }

    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    // Delete from Postgres database
    await query(`DELETE FROM users WHERE email = $1`, [email]);

    // Sync Revocation with Clerk
    const userList = await clerkClient.users.getUserList({ emailAddress: [email] });
    const clerkUsers = Array.isArray(userList) ? userList : userList.data;
    
    if (clerkUsers && clerkUsers.length > 0) {
      const targetClerkUser = clerkUsers[0];
      await clerkClient.users.updateUserMetadata(targetClerkUser.id, {
        publicMetadata: {
          role: 'user',
          permissions: []
        }
      });
    }

    res.status(200).json({ success: true, message: "Sub-admin removed successfully." });
  } catch (error: any) {
    console.error("Error deleting sub-admin:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/admin/target
app.get('/api/admin/target', async (req, res) => {
  try {
    const result = await query(`SELECT value FROM store_settings WHERE key = 'monthly_target'`);
    if (result.rows.length > 0) {
      res.json({ target: result.rows[0].value.target });
    } else {
      res.json({ target: 600000 }); // Default fallback
    }
  } catch (error: any) {
    console.error("Error fetching target:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/admin/target
app.post('/api/admin/target', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ error: "Unauthorized" });

    const payload = await clerkClient.verifyToken(token, {
      secretKey: process.env.CLERK_SECRET_KEY,
    });
    
    const userId = payload.sub;
    const user = await clerkClient.users.getUser(userId);
    const userEmail = user.emailAddresses[0]?.emailAddress;

    console.log('Attempting target update with email:', userEmail);

    const SUPER_ADMIN = 'info.sastocart@gmail.com';

    if (!userEmail || userEmail !== SUPER_ADMIN) {
      return res.status(403).json({ error: "Forbidden: Super Admin access required." });
    }

    const { target } = req.body;
    if (typeof target !== 'number') {
      return res.status(400).json({ error: "Target must be a number" });
    }

    await query(`
      INSERT INTO store_settings (key, value)
      VALUES ('monthly_target', $1)
      ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value
    `, [JSON.stringify({ target })]);

    res.json({ success: true, target });
  } catch (error: any) {
    console.error("Error updating target:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Initialize database tables, then start server
const startServer = async () => {
  try {
    await query(`
      CREATE TABLE IF NOT EXISTS store_settings (
        key VARCHAR(50) PRIMARY KEY,
        value JSONB
      )
    `);
    console.log("Initialized store_settings table.");
  } catch (error) {
    console.error("Failed to initialize database tables:", error);
  }

  app.listen(port, () => {
    console.log(`Backend API server running on http://localhost:${port}`);
  });
};

startServer();
