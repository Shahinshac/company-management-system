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
    await connection.query('DROP TABLE IF EXISTS dependent');
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
        address TEXT,
        phone VARCHAR(20),
        email VARCHAR(100),
        website VARCHAR(100),
        industry VARCHAR(50),
        founded_year INT,
        description TEXT,
        logo_url VARCHAR(500),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    console.log('✓ COMPANY table created');

    // Create EMPLOYEE table with enhanced fields
    await connection.query(`
      CREATE TABLE employee (
        emp_id INT AUTO_INCREMENT PRIMARY KEY,
        emp_name VARCHAR(100) NOT NULL,
        email VARCHAR(100) UNIQUE,
        phone VARCHAR(20),
        street_no INT,
        street_name VARCHAR(100),
        city VARCHAR(50),
        state VARCHAR(50),
        zip_code VARCHAR(20),
        country VARCHAR(50) DEFAULT 'USA',
        date_of_birth DATE,
        gender ENUM('Male', 'Female', 'Other'),
        marital_status ENUM('Single', 'Married', 'Divorced', 'Widowed'),
        nationality VARCHAR(50),
        national_id VARCHAR(50),
        photo_url VARCHAR(500),
        hire_date DATE,
        job_title VARCHAR(100),
        department VARCHAR(100),
        employment_type ENUM('Full-time', 'Part-time', 'Contract', 'Intern') DEFAULT 'Full-time',
        status ENUM('Active', 'On Leave', 'Terminated', 'Retired') DEFAULT 'Active',
        emergency_contact_name VARCHAR(100),
        emergency_contact_phone VARCHAR(20),
        emergency_contact_relation VARCHAR(50),
        bank_name VARCHAR(100),
        bank_account VARCHAR(50),
        bank_routing VARCHAR(50),
        notes TEXT,
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

    // Create DEPENDENT table for employee dependents
    await connection.query(`
      CREATE TABLE dependent (
        id INT AUTO_INCREMENT PRIMARY KEY,
        emp_id INT NOT NULL,
        dependent_name VARCHAR(100) NOT NULL,
        relationship ENUM('Spouse', 'Child', 'Parent', 'Sibling', 'Other') NOT NULL,
        date_of_birth DATE,
        gender ENUM('Male', 'Female', 'Other'),
        phone VARCHAR(20),
        email VARCHAR(100),
        address TEXT,
        is_emergency_contact BOOLEAN DEFAULT FALSE,
        health_insurance_id VARCHAR(50),
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (emp_id) REFERENCES employee(emp_id) ON DELETE CASCADE
      )
    `);
    console.log('✓ DEPENDENT table created');

    // Create USERS table for authentication with approval system
    await connection.query(`
      CREATE TABLE users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        email VARCHAR(100) UNIQUE,
        full_name VARCHAR(100),
        phone VARCHAR(20),
        role ENUM('Admin', 'Manager', 'User') DEFAULT 'User',
        status ENUM('Pending', 'Active', 'Suspended', 'Rejected') DEFAULT 'Pending',
        approved_by INT,
        approved_at TIMESTAMP NULL,
        rejection_reason TEXT,
        last_login TIMESTAMP NULL,
        login_attempts INT DEFAULT 0,
        locked_until TIMESTAMP NULL,
        emp_id INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (emp_id) REFERENCES employee(emp_id) ON DELETE SET NULL,
        FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL
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
    await connection.query('CREATE INDEX idx_employee_email ON employee(email)');
    await connection.query('CREATE INDEX idx_employee_status ON employee(status)');
    await connection.query('CREATE INDEX idx_company_city ON company(city)');
    await connection.query('CREATE INDEX idx_works_salary ON works(salary)');
    await connection.query('CREATE INDEX idx_dependent_emp ON dependent(emp_id)');
    await connection.query('CREATE INDEX idx_users_status ON users(status)');
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
      ('date_format', 'YYYY-MM-DD'),
      ('require_approval', 'true'),
      ('max_login_attempts', '5'),
      ('session_timeout', '3600')
    `);
    console.log('✓ Default settings inserted');

    // Insert sample data
    console.log('\nInserting sample data...');

    // Sample companies with enhanced fields
    await connection.query(`
      INSERT INTO company (company_name, city, address, phone, email, industry, founded_year, description) VALUES 
      ('TechCorp', 'New York', '123 Tech Ave, Floor 5', '212-555-0100', 'info@techcorp.com', 'Technology', 2010, 'Leading technology solutions provider'),
      ('DataSoft', 'San Francisco', '456 Data St, Suite 200', '415-555-0200', 'contact@datasoft.com', 'Software', 2015, 'Data analytics and software development'),
      ('WebInnovate', 'Los Angeles', '789 Web Blvd', '310-555-0300', 'hello@webinnovate.com', 'Web Development', 2018, 'Innovative web solutions'),
      ('CloudSystems', 'Seattle', '321 Cloud Way', '206-555-0400', 'support@cloudsystems.com', 'Cloud Computing', 2012, 'Enterprise cloud infrastructure'),
      ('CodeMasters', 'Austin', '654 Code Lane', '512-555-0500', 'team@codemasters.com', 'Software', 2016, 'Custom software development')
    `);
    console.log('✓ Sample companies inserted');

    // Sample employees with enhanced fields
    await connection.query(`
      INSERT INTO employee (emp_name, email, phone, street_no, street_name, city, state, date_of_birth, gender, marital_status, hire_date, job_title, department, employment_type, status) VALUES 
      ('John Smith', 'john.smith@company.com', '212-555-1001', 123, 'Main St', 'New York', 'NY', '1985-03-15', 'Male', 'Married', '2020-01-15', 'Senior Developer', 'Engineering', 'Full-time', 'Active'),
      ('Jane Doe', 'jane.doe@company.com', '415-555-1002', 456, 'Market St', 'San Francisco', 'CA', '1990-07-22', 'Female', 'Single', '2019-06-01', 'Project Manager', 'Management', 'Full-time', 'Active'),
      ('Bob Wilson', 'bob.wilson@company.com', '310-555-1003', 789, 'Sunset Blvd', 'Los Angeles', 'CA', '1988-11-30', 'Male', 'Married', '2021-03-20', 'UX Designer', 'Design', 'Full-time', 'Active'),
      ('Alice Brown', 'alice.brown@company.com', '206-555-1004', 321, 'Pine St', 'Seattle', 'WA', '1992-04-18', 'Female', 'Single', '2020-08-10', 'DevOps Engineer', 'Operations', 'Full-time', 'Active'),
      ('Charlie Davis', 'charlie.davis@company.com', '512-555-1005', 654, 'Congress Ave', 'Austin', 'TX', '1987-09-05', 'Male', 'Married', '2018-11-25', 'Tech Lead', 'Engineering', 'Full-time', 'Active'),
      ('Eva Martinez', 'eva.martinez@company.com', '212-555-1006', 987, 'Broadway', 'New York', 'NY', '1993-01-12', 'Female', 'Single', '2022-02-14', 'Data Analyst', 'Analytics', 'Full-time', 'Active'),
      ('Frank Johnson', 'frank.johnson@company.com', '415-555-1007', 111, 'Howard St', 'San Francisco', 'CA', '1986-06-28', 'Male', 'Married', '2019-09-15', 'Backend Developer', 'Engineering', 'Full-time', 'Active'),
      ('Grace Lee', 'grace.lee@company.com', '310-555-1008', 222, 'Wilshire Blvd', 'Los Angeles', 'CA', '1991-12-03', 'Female', 'Single', '2021-07-01', 'Frontend Developer', 'Engineering', 'Full-time', 'Active')
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

    // Sample dependents
    await connection.query(`
      INSERT INTO dependent (emp_id, dependent_name, relationship, date_of_birth, gender, is_emergency_contact) VALUES 
      (1, 'Sarah Smith', 'Spouse', '1987-05-20', 'Female', TRUE),
      (1, 'Tommy Smith', 'Child', '2015-08-10', 'Male', FALSE),
      (1, 'Emma Smith', 'Child', '2018-03-25', 'Female', FALSE),
      (3, 'Mary Wilson', 'Spouse', '1990-02-14', 'Female', TRUE),
      (5, 'Linda Davis', 'Spouse', '1989-07-08', 'Female', TRUE),
      (5, 'James Davis', 'Child', '2016-11-30', 'Male', FALSE),
      (7, 'Susan Johnson', 'Spouse', '1988-04-12', 'Female', TRUE)
    `);
    console.log('✓ Sample dependents inserted');

    // Create admin user (password: admin123) - already approved
    const hashedPassword = await bcrypt.hash('admin123', 10);
    await connection.query(`
      INSERT INTO users (username, password, email, full_name, role, status, approved_at) 
      VALUES ('admin', ?, 'admin@26-07.com', 'System Administrator', 'Admin', 'Active', NOW())
    `, [hashedPassword]);
    console.log('✓ Admin user created (username: admin, password: admin123)');

    console.log('\n========================================');
    console.log('Database initialization completed!');
    console.log('========================================');
    console.log('\nTables created:');
    console.log('  - company (with address, phone, email, industry, etc.)');
    console.log('  - employee (with photo, DOB, contact, bank info, etc.)');
    console.log('  - dependent (employee dependents/family)');
    console.log('  - works (emp_id, company_name, salary)');
    console.log('  - manages (emp_id, manager_id)');
    console.log('  - users (with approval system)');
    console.log('  - settings (system configuration)');
    console.log('  - audit_log (activity tracking)');
    console.log('\nDefault admin login:');
    console.log('  Username: admin');
    console.log('  Password: admin123');
    console.log('\nNote: New users require admin approval before login.');

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
