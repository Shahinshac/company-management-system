const mysql = require('mysql2/promise');

// Serverless-friendly connection (creates connection per request)
let connection = null;

async function getConnection() {
  // Reuse connection if exists and not closed
  if (connection && connection.connection && connection.connection._closing === false) {
    return connection;
  }

  // Create new connection
  connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'company_management',
    port: process.env.DB_PORT || 3306,
    // Important for serverless
    waitForConnections: true,
    connectionLimit: 1,
    queueLimit: 0
  });

  return connection;
}

// For serverless, export query function instead of pool
async function query(sql, params) {
  const conn = await getConnection();
  return await conn.execute(sql, params);
}

// For backwards compatibility with existing code
const db = {
  query: query,
  getConnection: getConnection
};

module.exports = db;
