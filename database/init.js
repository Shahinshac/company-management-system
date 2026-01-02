const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function initializeDatabase() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    port: process.env.DB_PORT || 3306
  });

  try {
    const dbName = process.env.DB_NAME || 'company_db';
    
    // Create database
    await connection.query(`CREATE DATABASE IF NOT EXISTS ${dbName}`);
    console.log(`✓ Database '${dbName}' created/verified`);
    
    await connection.query(`USE ${dbName}`);

    // Drop existing tables (in correct order due to foreign keys)
    console.log('Dropping existing tables...');
    await connection.query('SET FOREIGN_KEY_CHECKS = 0');
    await connection.query('DROP TABLE IF EXISTS audit_log');
    await connection.query('DROP TABLE IF EXISTS settings');
    await connection.query('DROP TABLE IF EXISTS manages');
    await connection.query('DROP TABLE IF EXISTS works');
    await connection.query('DROP TABLE IF EXISTS users');
    await connection.query('DROP TABLE IF EXISTS employee');
    await connection.query('DROP TABLE IF EXISTS company');
    await connection.query('SET FOREIGN_KEY_CHECKS = 1');

    // Create COMPANY table
    await connection.query(`
      CREATE TABLE company (
        company_name VARCHAR(50) PRIMARY KEY,
        city VARCHAR(50) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    console.log('✓ COMPANY table created');

    // Create EMPLOYEE table
    await connection.query(`
      CREATE TABLE employee (
        emp_id INT AUTO_INCREMENT PRIMARY KEY,
        emp_name VARCHAR(50) NOT NULL,
        street_no INT,
        city VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    console.log('✓ EMPLOYEE table created');

    // Create WORKS table (relationship between employee and company)
    await connection.query(`
      CREATE TABLE works (
        emp_id INT NOT NULL,
        company_name VARCHAR(50) NOT NULL,
        salary INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (emp_id, company_name),
        FOREIGN KEY (emp_id) REFERENCES employee(emp_id) ON DELETE CASCADE,
        FOREIGN KEY (company_name) REFERENCES company(company_name) ON DELETE CASCADE ON UPDATE CASCADE
      )
    `);
    console.log('✓ WORKS table created');

    // Create MANAGES table (self-referencing relationship)
    await connection.query(`
      CREATE TABLE manages (
        emp_id INT NOT NULL,
        manager_id INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (emp_id),
        FOREIGN KEY (emp_id) REFERENCES employee(emp_id) ON DELETE CASCADE,
        FOREIGN KEY (manager_id) REFERENCES employee(emp_id) ON DELETE CASCADE
      )
    `);
    console.log('✓ MANAGES table created');

    // Create USERS table for authentication
    await connection.query(`
      CREATE TABLE users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        email VARCHAR(100) UNIQUE,
        role ENUM('Admin', 'User') DEFAULT 'User',
        status ENUM('Active', 'Inactive') DEFAULT 'Active',
        emp_id INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (emp_id) REFERENCES employee(emp_id) ON DELETE SET NULL
      )
    `);
    console.log('✓ USERS table created');

    // Create SETTINGS table for company configuration
    await connection.query(`
      CREATE TABLE settings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        setting_key VARCHAR(100) UNIQUE NOT NULL,
        setting_value TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    console.log('✓ SETTINGS table created');

    // Create AUDIT_LOG table for tracking changes
    await connection.query(`
      CREATE TABLE audit_log (
        id INT AUTO_INCREMENT PRIMARY KEY,
        action VARCHAR(50) NOT NULL,
        entity_type VARCHAR(50) NOT NULL,
        entity_id VARCHAR(100),
        details JSON,
        user_id INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
      )
    `);
    console.log('✓ AUDIT_LOG table created');

    // Create indexes for better performance
    await connection.query('CREATE INDEX idx_employee_name ON employee(emp_name)');
    await connection.query('CREATE INDEX idx_employee_city ON employee(city)');
    await connection.query('CREATE INDEX idx_company_city ON company(city)');
    await connection.query('CREATE INDEX idx_works_salary ON works(salary)');
    await connection.query('CREATE INDEX idx_audit_entity ON audit_log(entity_type, entity_id)');
    await connection.query('CREATE INDEX idx_audit_created ON audit_log(created_at)');
    console.log('✓ Indexes created');

    // Insert default settings
    await connection.query(`
      INSERT INTO settings (setting_key, setting_value) VALUES 
      ('company_name', '26:07'),
      ('company_tagline', 'Excellence in Management'),
      ('currency', 'USD'),
      ('currency_symbol', '$'),
      ('date_format', 'YYYY-MM-DD')
    `);
    console.log('✓ Default settings inserted');

    // Insert sample data
    console.log('\nInserting sample data...');

    // Sample companies
    await connection.query(`
      INSERT INTO company (company_name, city) VALUES 
      ('TechCorp', 'New York'),
      ('DataSoft', 'San Francisco'),
      ('WebInnovate', 'Los Angeles'),
      ('CloudSystems', 'Seattle'),
      ('CodeMasters', 'Austin')
    `);
    console.log('✓ Sample companies inserted');

    // Sample employees
    await connection.query(`
      INSERT INTO employee (emp_name, street_no, city) VALUES 
      ('John Smith', 123, 'New York'),
      ('Jane Doe', 456, 'San Francisco'),
      ('Bob Wilson', 789, 'Los Angeles'),
      ('Alice Brown', 321, 'Seattle'),
      ('Charlie Davis', 654, 'Austin'),
      ('Eva Martinez', 987, 'New York'),
      ('Frank Johnson', 111, 'San Francisco'),
      ('Grace Lee', 222, 'Los Angeles')
    `);
    console.log('✓ Sample employees inserted');

    // Sample works relationships
    await connection.query(`
      INSERT INTO works (emp_id, company_name, salary) VALUES 
      (1, 'TechCorp', 75000),
      (2, 'DataSoft', 85000),
      (3, 'WebInnovate', 65000),
      (4, 'CloudSystems', 90000),
      (5, 'CodeMasters', 70000),
      (6, 'TechCorp', 80000),
      (7, 'DataSoft', 72000),
      (8, 'WebInnovate', 68000)
    `);
    console.log('✓ Sample work relationships inserted');

    // Sample manages relationships
    await connection.query(`
      INSERT INTO manages (emp_id, manager_id) VALUES 
      (2, 1),
      (3, 1),
      (5, 4),
      (6, 1),
      (7, 2),
      (8, 3)
    `);
    console.log('✓ Sample management relationships inserted');

    // Create admin user (password: admin123)
    const hashedPassword = await bcrypt.hash('admin123', 10);
    await connection.query(`
      INSERT INTO users (username, password, email, role, status) 
      VALUES ('admin', ?, 'admin@company.com', 'Admin', 'Active')
    `, [hashedPassword]);
    console.log('✓ Admin user created (username: admin, password: admin123)');

    console.log('\n========================================');
    console.log('Database initialization completed!');
    console.log('========================================');
    console.log('\nTables created:');
    console.log('  - company (company_name, city)');
    console.log('  - employee (emp_id, emp_name, street_no, city)');
    console.log('  - works (emp_id, company_name, salary)');
    console.log('  - manages (emp_id, manager_id)');
    console.log('  - users (authentication)');
    console.log('\nDefault admin login:');
    console.log('  Username: admin');
    console.log('  Password: admin123');

  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  } finally {
    await connection.end();
  }
}

// Run if called directly
if (require.main === module) {
  initializeDatabase()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = { initializeDatabase };
