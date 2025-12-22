/*
Script: update-admin-and-users.js
Purpose:
- Update or create admin user with username 'shahinsha', email 'shahinsha@26-07.com', role Admin, password 'shaahnc' (hashed) and ForcePasswordChange=1
- For all employees with empty/null email, set email to username@<domain>
- Default domain: 26-07.com
- DEFAULT BEHAVIOR: only set email for empty entries (no overwrite)

Usage:
  node scripts/update-admin-and-users.js --domain=26-07.com
  node scripts/update-admin-and-users.js --domain=26-07.com --overwrite (to overwrite all emails)

IMPORTANT: Do NOT paste real DB credentials here. Configure .env or environment variables locally before running.
*/

require('dotenv').config();
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

const argv = require('minimist')(process.argv.slice(2));
const domain = argv.domain || '26-07.com';
const overwrite = argv.overwrite || false;

(async function main() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 3306,
    connectionLimit: 5
  });

  try {
    const conn = await pool.getConnection();
    console.log('Connected to database.');

    // Ensure EMPLOYEE has required columns (best-effort)
    await conn.query(`ALTER TABLE EMPLOYEE 
      MODIFY COLUMN Username VARCHAR(50) UNIQUE NULL,
      MODIFY COLUMN Email VARCHAR(100) NULL,
      MODIFY COLUMN Role ENUM('Admin','Employee') DEFAULT 'Employee',
      MODIFY COLUMN Status ENUM('Active','Inactive') DEFAULT 'Active'
    `).catch(()=>{});

    // Find existing admin
    const [admins] = await conn.query("SELECT * FROM EMPLOYEE WHERE Role = 'Admin' LIMIT 1");
    const adminPasswordPlain = 'shaahnc';
    const hashed = await bcrypt.hash(adminPasswordPlain, 12);

    if (admins.length > 0) {
      const admin = admins[0];
      await conn.query(`UPDATE EMPLOYEE SET Username = ?, Email = ?, Password = ?, Role = 'Admin', ForcePasswordChange = 1 WHERE Id = ?`, ['shahinsha', `shahinsha@${domain}`, hashed, admin.Id]);
      console.log('Updated existing admin account.');
    } else {
      // Create new admin
      await conn.query(`INSERT INTO EMPLOYEE (Name, Username, Email, Password, Role, Status, ForcePasswordChange) VALUES (?, ?, ?, ?, 'Admin', 'Active', 1)`, ['Administrator', 'shahinsha', `shahinsha@${domain}`, hashed]);
      console.log('Created new admin account.');
    }

    // Update missing emails only (default behavior)
    if (!overwrite) {
      const [rows] = await conn.query(`SELECT Id, Username, Email FROM EMPLOYEE WHERE Email IS NULL OR Email = ''`);
      console.log(`Found ${rows.length} employees with empty email.`);
      for (const r of rows) {
        const email = `${r.Username}@${domain}`;
        await conn.query(`UPDATE EMPLOYEE SET Email = ? WHERE Id = ?`, [email, r.Id]);
      }
      console.log('Updated missing emails to username@' + domain);
    } else {
      // Overwrite all emails
      const [rows] = await conn.query(`SELECT Id, Username FROM EMPLOYEE`);
      console.log(`Overwriting emails for ${rows.length} employees.`);
      for (const r of rows) {
        const email = `${r.Username}@${domain}`;
        await conn.query(`UPDATE EMPLOYEE SET Email = ? WHERE Id = ?`, [email, r.Id]);
      }
      console.log('Overwrote all emails to username@' + domain);
    }

    // Done
    console.log('\nAll done. ADMIN username is set to "shahinsha" and password was updated (not displayed for security).');
    console.log('Please log in as admin and change the password immediately.');

    conn.release();
    await pool.end();
  } catch (err) {
    console.error('Script error:', err);
    process.exit(1);
  }
})();