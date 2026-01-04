const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function initializeDatabase() {
  const isCloud = process.env.DB_HOST && !process.env.DB_HOST.includes('localhost');
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    port: process.env.DB_PORT || 3306,
    ssl: isCloud ? { rejectUnauthorized: false } : undefined
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

    // Insert default settings with multi-currency support (Malappuram as main branch)
    await connection.query(`
      INSERT INTO settings (setting_key, setting_value) VALUES 
      ('company_name', '26:07'),
      ('company_tagline', 'Excellence in Management'),
      ('main_branch', 'Malappuram Branch'),
      ('currency', 'INR'),
      ('currency_symbol', '₹'),
      ('supported_currencies', 'INR,AED,GBP'),
      ('date_format', 'YYYY-MM-DD'),
      ('require_approval', 'true'),
      ('max_login_attempts', '5'),
      ('session_timeout', '3600')
    `);
    console.log('✓ Default settings inserted (Malappuram as main branch)');

    // Insert 5 branches data
    console.log('\nInserting branch data...');

    // 5 Branches: Malappuram (Main/Head Office), Kochi, Bangalore, Dubai, London
    await connection.query(`
      INSERT INTO company (company_name, city, address, phone, email, industry, founded_year, description) VALUES 
      ('Malappuram Branch', 'Malappuram', '123 MG Road, Malappuram', '+91-483-555-0100', 'head.office@26-07.com', 'Technology', 2020, 'Main Head Office - Malappuram, Kerala, India'),
      ('Kochi Branch', 'Kochi', '456 Marine Drive, Kochi', '+91-484-555-0200', 'kochi@26-07.com', 'Software', 2020, 'Kochi Branch - Kerala, India'),
      ('Bangalore Branch', 'Bangalore', '789 MG Road, Bangalore', '+91-80-555-0300', 'bangalore@26-07.com', 'Technology', 2020, 'Bangalore Branch - Karnataka, India'),
      ('Dubai Branch', 'Dubai', '321 Sheikh Zayed Road, Dubai', '+971-4-555-0400', 'dubai@26-07.com', 'Technology', 2020, 'Dubai Branch - UAE'),
      ('London Branch', 'London', '654 Oxford Street, London', '+44-20-555-0500', 'london@26-07.com', 'FinTech', 2020, 'London Branch - UK')
    `);
    console.log('✓ 5 Branches created (Malappuram, Kochi, Bangalore, Dubai, London)');

    // Employees for each branch
    await connection.query(`
      INSERT INTO employee (emp_name, email, phone, city, state, country, date_of_birth, gender, hire_date, job_title, department, employment_type, status, nationality) VALUES 
      -- Malappuram Branch Employees
      ('Mohammed Ashraf', 'ashraf@26-07.com', '+91-9847551001', 'Malappuram', 'Kerala', 'India', '1985-03-15', 'Male', '2022-01-15', 'Senior Developer', 'Engineering', 'Full-time', 'Active', 'Indian'),
      ('Fathima Beevi', 'fathima@26-07.com', '+91-9847551002', 'Malappuram', 'Kerala', 'India', '1990-07-22', 'Female', '2021-06-01', 'Project Manager', 'Management', 'Full-time', 'Active', 'Indian'),
      ('Abdul Rahman', 'rahman@26-07.com', '+91-9847551003', 'Malappuram', 'Kerala', 'India', '1988-11-30', 'Male', '2023-03-20', 'UI Designer', 'Design', 'Full-time', 'Active', 'Indian'),
      ('Safiya Noor', 'safiya@26-07.com', '+91-9847551004', 'Malappuram', 'Kerala', 'India', '1992-04-18', 'Female', '2022-08-10', 'Data Analyst', 'Analytics', 'Full-time', 'Active', 'Indian'),
      ('Irfan Ali', 'irfan@26-07.com', '+91-9847551005', 'Malappuram', 'Kerala', 'India', '1987-09-05', 'Male', '2021-11-25', 'Backend Developer', 'Engineering', 'Full-time', 'Active', 'Indian'),
      -- Kochi Branch Employees
      ('Priya Nair', 'priya@26-07.com', '+91-9447552001', 'Kochi', 'Kerala', 'India', '1986-06-28', 'Female', '2021-09-15', 'Tech Lead', 'Engineering', 'Full-time', 'Active', 'Indian'),
      ('Vijay Kumar', 'vijay@26-07.com', '+91-9447552002', 'Kochi', 'Kerala', 'India', '1991-12-03', 'Male', '2022-07-01', 'DevOps Engineer', 'Operations', 'Full-time', 'Active', 'Indian'),
      ('Lakshmi Pillai', 'lakshmi@26-07.com', '+91-9447552003', 'Kochi', 'Kerala', 'India', '1993-01-12', 'Female', '2023-02-14', 'QA Engineer', 'Quality', 'Full-time', 'Active', 'Indian'),
      ('Suresh Babu', 'suresh@26-07.com', '+91-9447552004', 'Kochi', 'Kerala', 'India', '1989-08-25', 'Male', '2022-04-20', 'Frontend Developer', 'Engineering', 'Full-time', 'Active', 'Indian'),
      ('Deepa Thomas', 'deepa@26-07.com', '+91-9447552005', 'Kochi', 'Kerala', 'India', '1988-04-10', 'Female', '2021-05-15', 'HR Manager', 'Human Resources', 'Full-time', 'Active', 'Indian'),
      -- Bangalore Branch Employees
      ('Ananya Reddy', 'ananya@26-07.com', '+91-9845553001', 'Bangalore', 'Karnataka', 'India', '1984-05-20', 'Female', '2020-08-15', 'Senior Architect', 'Engineering', 'Full-time', 'Active', 'Indian'),
      ('Rahul Gowda', 'rahul.g@26-07.com', '+91-9845553002', 'Bangalore', 'Karnataka', 'India', '1987-11-15', 'Male', '2021-03-01', 'Product Manager', 'Product', 'Full-time', 'Active', 'Indian'),
      ('Meera Shetty', 'meera@26-07.com', '+91-9845553003', 'Bangalore', 'Karnataka', 'India', '1990-02-28', 'Female', '2022-06-20', 'Cloud Engineer', 'Infrastructure', 'Full-time', 'Active', 'Indian'),
      ('Naveen Prasad', 'naveen@26-07.com', '+91-9845553004', 'Bangalore', 'Karnataka', 'India', '1992-09-08', 'Male', '2023-01-10', 'Mobile Developer', 'Engineering', 'Full-time', 'Active', 'Indian'),
      ('Divya Rao', 'divya@26-07.com', '+91-9845553005', 'Bangalore', 'Karnataka', 'India', '1991-06-17', 'Female', '2022-09-05', 'Data Scientist', 'Analytics', 'Full-time', 'Active', 'Indian'),
      -- Dubai Branch Employees
      ('Fatima Al Maktoum', 'fatima.m@26-07.com', '+971-50-5554001', 'Dubai', 'Dubai', 'UAE', '1983-12-10', 'Female', '2020-11-01', 'Operations Director', 'Operations', 'Full-time', 'Active', 'Emirati'),
      ('Omar Khalid', 'omar@26-07.com', '+971-50-5554002', 'Dubai', 'Dubai', 'UAE', '1986-03-22', 'Male', '2021-04-15', 'Senior Developer', 'Engineering', 'Full-time', 'Active', 'Emirati'),
      ('Aisha Bin Rashid', 'aisha@26-07.com', '+971-50-5554003', 'Dubai', 'Dubai', 'UAE', '1989-07-05', 'Female', '2022-02-28', 'Business Analyst', 'Business', 'Full-time', 'Active', 'Emirati'),
      ('Yusuf Al Ameri', 'yusuf@26-07.com', '+971-50-5554004', 'Dubai', 'Dubai', 'UAE', '1988-01-18', 'Male', '2021-08-20', 'Security Engineer', 'Security', 'Full-time', 'Active', 'Emirati'),
      ('Mariam Khan', 'mariam@26-07.com', '+971-50-5554005', 'Dubai', 'Dubai', 'UAE', '1991-09-30', 'Female', '2023-03-01', 'Marketing Manager', 'Marketing', 'Full-time', 'Active', 'Emirati'),
      -- London Branch Employees
      ('Emma Thompson', 'emma@26-07.com', '+44-7700-555001', 'London', 'England', 'UK', '1980-08-15', 'Female', '2020-01-10', 'CTO', 'Executive', 'Full-time', 'Active', 'British'),
      ('Oliver Smith', 'oliver@26-07.com', '+44-7700-555002', 'London', 'England', 'UK', '1985-04-12', 'Male', '2020-06-15', 'Lead Engineer', 'Engineering', 'Full-time', 'Active', 'British'),
      ('Sophie Brown', 'sophie@26-07.com', '+44-7700-555003', 'London', 'England', 'UK', '1988-11-28', 'Female', '2021-03-20', 'Finance Manager', 'Finance', 'Full-time', 'Active', 'British'),
      ('William Taylor', 'william@26-07.com', '+44-7700-555004', 'London', 'England', 'UK', '1987-06-20', 'Male', '2021-09-01', 'Compliance Officer', 'Legal', 'Full-time', 'Active', 'British'),
      ('Charlotte Davis', 'charlotte@26-07.com', '+44-7700-555005', 'London', 'England', 'UK', '1990-02-08', 'Female', '2022-04-15', 'UX Lead', 'Design', 'Full-time', 'Active', 'British')
    `);
    console.log('✓ 25 employees created (5 per branch)');

    // Works relationships for each branch (INR salaries for India, AED for Dubai, GBP for London)
    await connection.query(`
      INSERT INTO works (emp_id, company_name, salary) VALUES 
      -- Malappuram Branch (INR)
      (1, 'Malappuram Branch', 75000),
      (2, 'Malappuram Branch', 85000),
      (3, 'Malappuram Branch', 65000),
      (4, 'Malappuram Branch', 70000),
      (5, 'Malappuram Branch', 72000),
      -- Kochi Branch (INR)
      (6, 'Kochi Branch', 90000),
      (7, 'Kochi Branch', 78000),
      (8, 'Kochi Branch', 60000),
      (9, 'Kochi Branch', 68000),
      (10, 'Kochi Branch', 82000),
      -- Bangalore Branch (INR)
      (11, 'Bangalore Branch', 120000),
      (12, 'Bangalore Branch', 100000),
      (13, 'Bangalore Branch', 95000),
      (14, 'Bangalore Branch', 80000),
      (15, 'Bangalore Branch', 110000),
      -- Dubai Branch (AED)
      (16, 'Dubai Branch', 25000),
      (17, 'Dubai Branch', 18000),
      (18, 'Dubai Branch', 15000),
      (19, 'Dubai Branch', 20000),
      (20, 'Dubai Branch', 16000),
      -- London Branch (GBP)
      (21, 'London Branch', 8500),
      (22, 'London Branch', 6500),
      (23, 'London Branch', 5500),
      (24, 'London Branch', 5000),
      (25, 'London Branch', 6000)
    `);
    console.log('✓ Employee-branch work relationships created');

    // Management hierarchy (first employee in each branch manages others)
    await connection.query(`
      INSERT INTO manages (emp_id, manager_id) VALUES 
      -- Malappuram: Mohammed Ashraf manages others
      (2, 1), (3, 1), (4, 1), (5, 1),
      -- Kochi: Priya Nair manages others
      (7, 6), (8, 6), (9, 6), (10, 6),
      -- Bangalore: Ananya Reddy manages others
      (12, 11), (13, 11), (14, 11), (15, 11),
      -- Dubai: Fatima Al Maktoum manages others
      (17, 16), (18, 16), (19, 16), (20, 16),
      -- London: Emma Thompson manages others
      (22, 21), (23, 21), (24, 21), (25, 21)
    `);
    console.log('✓ Management hierarchy created');

    // Dependents
    await connection.query(`
      INSERT INTO dependent (emp_id, dependent_name, relationship, date_of_birth, gender, is_emergency_contact) VALUES 
      -- Malappuram
      (1, 'Amina Ashraf', 'Spouse', '1987-05-20', 'Female', TRUE),
      (1, 'Hassan Ashraf', 'Child', '2015-08-10', 'Male', FALSE),
      -- Kochi
      (6, 'Anu Nair', 'Spouse', '1988-03-15', 'Female', TRUE),
      -- Bangalore
      (11, 'Arjun Reddy', 'Spouse', '1986-09-12', 'Male', TRUE),
      -- Dubai
      (16, 'Layla Al Maktoum', 'Child', '2018-06-20', 'Female', FALSE),
      -- London
      (21, 'George Thompson', 'Spouse', '1982-11-30', 'Male', TRUE)
    `);
    console.log('✓ Dependents created');

    // Create branch admins - Shahinsha is the Malappuram (Head Office) admin
    const shahinPassword = await bcrypt.hash('2007', 10);
    const adminPassword = await bcrypt.hash('admin123', 10);
    
    await connection.query(`
      INSERT INTO users (username, password, email, full_name, role, status, approved_at) VALUES 
      ('shahinsha', ?, 'shahinsha@26-07.com', 'Shahinsha', 'Admin', 'Active', NOW()),
      ('admin_kochi', ?, 'admin.kochi@26-07.com', 'Arun Menon', 'Admin', 'Active', NOW()),
      ('admin_blr', ?, 'admin.blr@26-07.com', 'Karthik Sharma', 'Admin', 'Active', NOW()),
      ('admin_dubai', ?, 'admin.dubai@26-07.com', 'Ahmed Hassan', 'Admin', 'Active', NOW()),
      ('admin_london', ?, 'admin.london@26-07.com', 'James Williams', 'Admin', 'Active', NOW())
    `, [shahinPassword, adminPassword, adminPassword, adminPassword, adminPassword]);
    console.log('✓ Admin users created');
    console.log('   - Malappuram Admin (Head Office): shahinsha / 2007');
    console.log('   - Kochi Admin: admin_kochi / admin123');
    console.log('   - Bangalore Admin: admin_blr / admin123');
    console.log('   - Dubai Admin: admin_dubai / admin123');
    console.log('   - London Admin: admin_london / admin123');

    console.log('\n========================================');
    console.log('Database initialization completed!');
    console.log('========================================');
    console.log('\nTables created:');
    console.log('  - company (5 branches - Malappuram as Main Head Office)');
    console.log('  - employee (25 employees - 5 per branch)');
    console.log('  - dependent (employee dependents/family)');
    console.log('  - works (emp_id, company_name, salary)');
    console.log('  - manages (emp_id, manager_id)');
    console.log('  - users (5 branch admins - Shahinsha heads Malappuram)');
    console.log('  - settings (system configuration)');
    console.log('  - audit_log (activity tracking)');
    console.log('\nCurrencies:');
    console.log('  - India (Malappuram, Kochi, Bangalore): INR (₹)');
    console.log('  - Dubai: AED (د.إ)');
    console.log('  - London: GBP (£)');
    console.log('\nAll emails use @26-07.com domain');
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
