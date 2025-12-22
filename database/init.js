const mysql = require('mysql2/promise');
require('dotenv').config();

async function initializeDatabase() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    port: process.env.DB_PORT || 3306
  });

  try {
    // Create database if not exists
    await connection.query(`CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME || 'company_management'}`);
    console.log('Database created or already exists');

    // Use the database
    await connection.query(`USE ${process.env.DB_NAME || 'company_management'}`);

    // Add authentication fields to EMPLOYEE table (if missing)
    await connection.query(`
      ALTER TABLE EMPLOYEE
      ADD COLUMN IF NOT EXISTS Username VARCHAR(50) UNIQUE,
      ADD COLUMN IF NOT EXISTS Password VARCHAR(255),
      ADD COLUMN IF NOT EXISTS Role ENUM('Admin','Employee') DEFAULT 'Employee',
      ADD COLUMN IF NOT EXISTS Status ENUM('Active','Inactive') DEFAULT 'Active',
      ADD COLUMN IF NOT EXISTS ForcePasswordChange TINYINT(1) DEFAULT 0
    `);
    console.log('EMPLOYEE table updated with authentication fields');

    // Create DEPARTMENT table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS DEPARTMENT (
        D_No VARCHAR(20) PRIMARY KEY,
        Name VARCHAR(100) NOT NULL,
        Location VARCHAR(200),
        Manager_Id INT,
        Manager_Start_Date DATE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    console.log('DEPARTMENT table created');

    // Create EMPLOYEE table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS EMPLOYEE (
        Id INT AUTO_INCREMENT PRIMARY KEY,
        Name VARCHAR(100) NOT NULL,
        Gender ENUM('Male', 'Female', 'Other') NOT NULL,
        Address VARCHAR(255),
        Dob DATE,
        Doj DATE,
        Department_No VARCHAR(20),
        Since DATE,
        Salary DECIMAL(10, 2),
        Email VARCHAR(100) UNIQUE,
        Phone VARCHAR(20),
        Photo LONGTEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (Department_No) REFERENCES DEPARTMENT(D_No) ON DELETE SET NULL
      )
    `);
    console.log('EMPLOYEE table created');

    // Add foreign key for manager in DEPARTMENT table
    await connection.query(`
      ALTER TABLE DEPARTMENT 
      ADD CONSTRAINT fk_manager 
      FOREIGN KEY (Manager_Id) REFERENCES EMPLOYEE(Id) ON DELETE SET NULL
    `).catch(() => {
      console.log('Manager foreign key already exists or cannot be added');
    });

    // Create PROJECT table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS PROJECT (
        P_No VARCHAR(20) PRIMARY KEY,
        Name VARCHAR(100) NOT NULL,
        Location VARCHAR(200),
        Department_No VARCHAR(20),
        Budget DECIMAL(15, 2),
        Start_Date DATE,
        End_Date DATE,
        Status ENUM('Planning', 'Active', 'Completed', 'On Hold') DEFAULT 'Planning',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (Department_No) REFERENCES DEPARTMENT(D_No) ON DELETE SET NULL
      )
    `);
    console.log('PROJECT table created');

    // Create DEPENDENT table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS DEPENDENT (
        Id INT AUTO_INCREMENT PRIMARY KEY,
        Employee_Id INT NOT NULL,
        D_name VARCHAR(100) NOT NULL,
        Gender ENUM('Male', 'Female', 'Other') NOT NULL,
        Relationship VARCHAR(50) NOT NULL,
        Date_of_Birth DATE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (Employee_Id) REFERENCES EMPLOYEE(Id) ON DELETE CASCADE
      )
    `);
    console.log('DEPENDENT table created');

    // Create WORKS_ON junction table (Employee-Project relationship)
    await connection.query(`
      CREATE TABLE IF NOT EXISTS WORKS_ON (
        Employee_Id INT NOT NULL,
        Project_No VARCHAR(20) NOT NULL,
        Hours DECIMAL(5, 2) DEFAULT 0,
        Assignment_Date DATE,
        Role VARCHAR(50),
        PRIMARY KEY (Employee_Id, Project_No),
        FOREIGN KEY (Employee_Id) REFERENCES EMPLOYEE(Id) ON DELETE CASCADE,
        FOREIGN KEY (Project_No) REFERENCES PROJECT(P_No) ON DELETE CASCADE
      )
    `);
    console.log('WORKS_ON table created');

    // Insert sample data
    console.log('\nInserting sample data...');

    // Sample Departments
    await connection.query(`
      INSERT IGNORE INTO DEPARTMENT (D_No, Name, Location) VALUES
      ('D001', 'Human Resources', 'Headquarters'),
      ('D002', 'Engineering', 'Tech Park'),
      ('D003', 'Sales', 'Downtown Office'),
      ('D004', 'Finance', 'Headquarters'),
      ('D005', 'Marketing', 'Creative Hub')
    `);
    console.log('Sample departments inserted');

    // Sample Employees
    await connection.query(`
      INSERT IGNORE INTO EMPLOYEE (Name, Gender, Address, Dob, Doj, Department_No, Since, Salary, Email, Phone) VALUES
      ('John Smith', 'Male', '123 Main St, City', '1985-05-15', '2020-01-15', 'D002', '2020-01-15', 75000.00, 'john.smith@company.com', '555-0101'),
      ('Sarah Johnson', 'Female', '456 Oak Ave, City', '1990-08-22', '2019-03-10', 'D001', '2019-03-10', 65000.00, 'sarah.johnson@company.com', '555-0102'),
      ('Michael Chen', 'Male', '789 Pine Rd, City', '1988-11-30', '2021-06-01', 'D002', '2021-06-01', 80000.00, 'michael.chen@company.com', '555-0103'),
      ('Emily Davis', 'Female', '321 Elm St, City', '1992-03-18', '2022-02-15', 'D003', '2022-02-15', 70000.00, 'emily.davis@company.com', '555-0104'),
      ('David Wilson', 'Male', '654 Maple Dr, City', '1987-07-25', '2018-09-20', 'D004', '2018-09-20', 85000.00, 'david.wilson@company.com', '555-0105')
    `);
    console.log('Sample employees inserted');

    // Update department managers
    await connection.query(`
      UPDATE DEPARTMENT SET Manager_Id = 2, Manager_Start_Date = '2019-03-10' WHERE D_No = 'D001'
    `);
    await connection.query(`
      UPDATE DEPARTMENT SET Manager_Id = 1, Manager_Start_Date = '2020-01-15' WHERE D_No = 'D002'
    `);
    await connection.query(`
      UPDATE DEPARTMENT SET Manager_Id = 4, Manager_Start_Date = '2022-02-15' WHERE D_No = 'D003'
    `);
    console.log('Department managers assigned');

    // Sample Projects
    await connection.query(`
      INSERT IGNORE INTO PROJECT (P_No, Name, Location, Department_No, Budget, Start_Date, Status) VALUES
      ('P001', 'Employee Portal Development', 'Tech Park', 'D002', 150000.00, '2024-01-01', 'Active'),
      ('P002', 'Recruitment System', 'Headquarters', 'D001', 80000.00, '2024-02-15', 'Active'),
      ('P003', 'Sales CRM Implementation', 'Downtown Office', 'D003', 200000.00, '2024-03-01', 'Planning'),
      ('P004', 'Financial Reporting System', 'Headquarters', 'D004', 120000.00, '2023-11-01', 'Active')
    `);
    console.log('Sample projects inserted');

    // Sample Work Assignments
    await connection.query(`
      INSERT IGNORE INTO WORKS_ON (Employee_Id, Project_No, Hours, Assignment_Date, Role) VALUES
      (1, 'P001', 40.00, '2024-01-01', 'Lead Developer'),
      (3, 'P001', 35.00, '2024-01-05', 'Developer'),
      (2, 'P002', 30.00, '2024-02-15', 'Project Manager'),
      (4, 'P003', 25.00, '2024-03-01', 'Sales Analyst'),
      (5, 'P004', 40.00, '2023-11-01', 'Financial Analyst')
    `);
    console.log('Sample work assignments inserted');

    // Sample Dependents
    await connection.query(`
      INSERT IGNORE INTO DEPENDENT (Employee_Id, D_name, Gender, Relationship, Date_of_Birth) VALUES
      (1, 'Emma Smith', 'Female', 'Daughter', '2015-08-10'),
      (1, 'Lisa Smith', 'Female', 'Spouse', '1986-12-05'),
      (2, 'Tom Johnson', 'Male', 'Son', '2018-04-22'),
      (5, 'Anna Wilson', 'Female', 'Spouse', '1989-09-15')
    `);
    console.log('Sample dependents inserted');

    // Create default admin in EMPLOYEE table if not exists
    const bcrypt = require('bcryptjs');
    const adminPassword = await bcrypt.hash('admin123', 10);
    await connection.query(`
      INSERT IGNORE INTO EMPLOYEE (Name, Username, Email, Password, Role, Status)
      VALUES ('Administrator', 'admin', 'admin@company.com', '${adminPassword}', 'Admin', 'Active')
    `);
    console.log('Default admin employee created (Username: admin, Password: admin123)');

    console.log('\n✅ Database initialization completed successfully!');

  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  } finally {
    await connection.end();
  }
}

// Run initialization
if (require.main === module) {
  initializeDatabase()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = initializeDatabase;
