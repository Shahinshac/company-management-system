const mysql = require('mysql2/promise');
require('dotenv').config();

// Database connection pool
// Optional SSL configuration for managed DBs (set DB_SSL=true in production if required)
const useSsl = (process.env.DB_SSL || 'false').toLowerCase() === 'true';
const sslOptions = {};
if (useSsl) {
  // DB_CA can contain the CA certificate as plain text or base64 encoded data
  if (process.env.DB_CA) {
    // Support both plain and base64 encoded CA
    let ca = process.env.DB_CA;
    try {
      // if it's base64, decode; if not, this will throw and we'll use raw value
      const decoded = Buffer.from(ca, 'base64').toString('utf8');
      if (decoded && decoded.includes('BEGIN CERTIFICATE')) ca = decoded;
    } catch (e) {
      // ignore, use raw
    }
    sslOptions.ssl = { ca };
  } else {
    // No CA provided - use default SSL (may still work for some providers)
    sslOptions.ssl = { rejectUnauthorized: true };
  }
}

const pool = mysql.createPool(Object.assign({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'company_management',
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
}, sslOptions));

// Test connection
pool.getConnection()
  .then(connection => {
    console.log('Database connected successfully');
    connection.release();
  })
  .catch(err => {
    // Log full error for debugging
    console.error('Database connection failed:', err && err.stack ? err.stack : err);
    // If running in production, surface a clearer warning
    if (process.env.NODE_ENV === 'production') {
      console.warn('Unable to connect to the configured database. Please verify DB_HOST/DB_USER/DB_PASSWORD/DB_NAME/DB_PORT and DB_SSL/DB_CA settings in your deployment environment.');
    }
  });

module.exports = pool;
