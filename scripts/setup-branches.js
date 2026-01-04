require('dotenv').config();
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

/**
 * Branch Configuration for 26:07 Company
 * 5 Branches: Malappuram, Kochi, Bangalore, Dubai, London
 * Each with local currency, admin, and employees
 */

const branches = [
  {
    name: 'Malappuram Branch',
    city: 'Malappuram',
    state: 'Kerala',
    country: 'India',
    currency: 'INR',
    currencySymbol: '₹',
    phone: '+91-483-555-0100',
    email: 'malappuram@26-07.com',
    address: '123 MG Road, Malappuram',
    industry: 'Technology',
    admin: {
      username: 'admin_mlp',
      password: 'admin123',
      email: 'admin.mlp@26-07.com',
      fullName: 'Rashid Karim'
    },
    employees: [
      { name: 'Mohammed Ashraf', email: 'ashraf@26-07.com', phone: '+91-9847551001', job_title: 'Senior Developer', department: 'Engineering', gender: 'Male', dob: '1985-03-15' },
      { name: 'Fathima Beevi', email: 'fathima@26-07.com', phone: '+91-9847551002', job_title: 'Project Manager', department: 'Management', gender: 'Female', dob: '1990-07-22' },
      { name: 'Abdul Rahman', email: 'rahman@26-07.com', phone: '+91-9847551003', job_title: 'UI Designer', department: 'Design', gender: 'Male', dob: '1988-11-30' },
      { name: 'Safiya Noor', email: 'safiya@26-07.com', phone: '+91-9847551004', job_title: 'Data Analyst', department: 'Analytics', gender: 'Female', dob: '1992-04-18' },
      { name: 'Irfan Ali', email: 'irfan@26-07.com', phone: '+91-9847551005', job_title: 'Backend Developer', department: 'Engineering', gender: 'Male', dob: '1987-09-05' }
    ],
    salaryBase: 50000
  },
  {
    name: 'Kochi Branch',
    city: 'Kochi',
    state: 'Kerala',
    country: 'India',
    currency: 'INR',
    currencySymbol: '₹',
    phone: '+91-484-555-0200',
    email: 'kochi@26-07.com',
    address: '456 Marine Drive, Kochi',
    industry: 'Software',
    admin: {
      username: 'admin_kochi',
      password: 'admin123',
      email: 'admin.kochi@26-07.com',
      fullName: 'Arun Menon'
    },
    employees: [
      { name: 'Priya Nair', email: 'priya@26-07.com', phone: '+91-9447552001', job_title: 'Tech Lead', department: 'Engineering', gender: 'Female', dob: '1986-06-28' },
      { name: 'Vijay Kumar', email: 'vijay@26-07.com', phone: '+91-9447552002', job_title: 'DevOps Engineer', department: 'Operations', gender: 'Male', dob: '1991-12-03' },
      { name: 'Lakshmi Pillai', email: 'lakshmi@26-07.com', phone: '+91-9447552003', job_title: 'QA Engineer', department: 'Quality', gender: 'Female', dob: '1993-01-12' },
      { name: 'Suresh Babu', email: 'suresh@26-07.com', phone: '+91-9447552004', job_title: 'Frontend Developer', department: 'Engineering', gender: 'Male', dob: '1989-08-25' },
      { name: 'Deepa Thomas', email: 'deepa@26-07.com', phone: '+91-9447552005', job_title: 'HR Manager', department: 'Human Resources', gender: 'Female', dob: '1988-04-10' }
    ],
    salaryBase: 55000
  },
  {
    name: 'Bangalore Branch',
    city: 'Bangalore',
    state: 'Karnataka',
    country: 'India',
    currency: 'INR',
    currencySymbol: '₹',
    phone: '+91-80-555-0300',
    email: 'bangalore@26-07.com',
    address: '789 MG Road, Bangalore',
    industry: 'Technology',
    admin: {
      username: 'admin_blr',
      password: 'admin123',
      email: 'admin.blr@26-07.com',
      fullName: 'Karthik Sharma'
    },
    employees: [
      { name: 'Ananya Reddy', email: 'ananya@26-07.com', phone: '+91-9845553001', job_title: 'Senior Architect', department: 'Engineering', gender: 'Female', dob: '1984-05-20' },
      { name: 'Rahul Gowda', email: 'rahul.g@26-07.com', phone: '+91-9845553002', job_title: 'Product Manager', department: 'Product', gender: 'Male', dob: '1987-11-15' },
      { name: 'Meera Shetty', email: 'meera@26-07.com', phone: '+91-9845553003', job_title: 'Cloud Engineer', department: 'Infrastructure', gender: 'Female', dob: '1990-02-28' },
      { name: 'Naveen Prasad', email: 'naveen@26-07.com', phone: '+91-9845553004', job_title: 'Mobile Developer', department: 'Engineering', gender: 'Male', dob: '1992-09-08' },
      { name: 'Divya Rao', email: 'divya@26-07.com', phone: '+91-9845553005', job_title: 'Data Scientist', department: 'Analytics', gender: 'Female', dob: '1991-06-17' }
    ],
    salaryBase: 70000
  },
  {
    name: 'Dubai Branch',
    city: 'Dubai',
    state: 'Dubai',
    country: 'UAE',
    currency: 'AED',
    currencySymbol: 'د.إ',
    phone: '+971-4-555-0400',
    email: 'dubai@26-07.com',
    address: '321 Sheikh Zayed Road, Dubai',
    industry: 'Technology',
    admin: {
      username: 'admin_dubai',
      password: 'admin123',
      email: 'admin.dubai@26-07.com',
      fullName: 'Ahmed Hassan'
    },
    employees: [
      { name: 'Fatima Al Maktoum', email: 'fatima.m@26-07.com', phone: '+971-50-5554001', job_title: 'Operations Director', department: 'Operations', gender: 'Female', dob: '1983-12-10' },
      { name: 'Omar Khalid', email: 'omar@26-07.com', phone: '+971-50-5554002', job_title: 'Senior Developer', department: 'Engineering', gender: 'Male', dob: '1986-03-22' },
      { name: 'Aisha Bin Rashid', email: 'aisha@26-07.com', phone: '+971-50-5554003', job_title: 'Business Analyst', department: 'Business', gender: 'Female', dob: '1989-07-05' },
      { name: 'Yusuf Al Ameri', email: 'yusuf@26-07.com', phone: '+971-50-5554004', job_title: 'Security Engineer', department: 'Security', gender: 'Male', dob: '1988-01-18' },
      { name: 'Mariam Khan', email: 'mariam@26-07.com', phone: '+971-50-5554005', job_title: 'Marketing Manager', department: 'Marketing', gender: 'Female', dob: '1991-09-30' }
    ],
    salaryBase: 15000
  },
  {
    name: 'London Branch',
    city: 'London',
    state: 'England',
    country: 'UK',
    currency: 'GBP',
    currencySymbol: '£',
    phone: '+44-20-555-0500',
    email: 'london@26-07.com',
    address: '654 Oxford Street, London',
    industry: 'FinTech',
    admin: {
      username: 'admin_london',
      password: 'admin123',
      email: 'admin.london@26-07.com',
      fullName: 'James Williams'
    },
    employees: [
      { name: 'Emma Thompson', email: 'emma@26-07.com', phone: '+44-7700-555001', job_title: 'CTO', department: 'Executive', gender: 'Female', dob: '1980-08-15' },
      { name: 'Oliver Smith', email: 'oliver@26-07.com', phone: '+44-7700-555002', job_title: 'Lead Engineer', department: 'Engineering', gender: 'Male', dob: '1985-04-12' },
      { name: 'Sophie Brown', email: 'sophie@26-07.com', phone: '+44-7700-555003', job_title: 'Finance Manager', department: 'Finance', gender: 'Female', dob: '1988-11-28' },
      { name: 'William Taylor', email: 'william@26-07.com', phone: '+44-7700-555004', job_title: 'Compliance Officer', department: 'Legal', gender: 'Male', dob: '1987-06-20' },
      { name: 'Charlotte Davis', email: 'charlotte@26-07.com', phone: '+44-7700-555005', job_title: 'UX Lead', department: 'Design', gender: 'Female', dob: '1990-02-08' }
    ],
    salaryBase: 5000
  }
];

async function setupBranches() {
  const isCloud = process.env.DB_HOST && !process.env.DB_HOST.includes('localhost');
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    port: process.env.DB_PORT || 3306,
    database: process.env.DB_NAME || 'company_db',
    ssl: isCloud ? { rejectUnauthorized: false } : undefined
  });

  try {
    console.log('========================================');
    console.log('  26:07 Company - Branch Setup Script');
    console.log('========================================\n');

    // Clear existing data
    console.log('Clearing existing data...');
    await connection.query('SET FOREIGN_KEY_CHECKS = 0');
    await connection.query('DELETE FROM dependent');
    await connection.query('DELETE FROM manages');
    await connection.query('DELETE FROM works');
    await connection.query('DELETE FROM users WHERE username != "admin"');
    await connection.query('DELETE FROM employee');
    await connection.query('DELETE FROM company');
    await connection.query('SET FOREIGN_KEY_CHECKS = 1');
    console.log('✓ Existing data cleared\n');

    // Update main admin email
    await connection.query(`UPDATE users SET email = 'admin@26-07.com' WHERE username = 'admin'`);
    console.log('✓ Updated main admin email to admin@26-07.com\n');

    let totalEmployees = 0;
    let totalAdmins = 0;

    for (const branch of branches) {
      console.log(`\n--- Setting up ${branch.name} ---`);

      // Create company/branch
      await connection.query(`
        INSERT INTO company (company_name, city, address, phone, email, industry, founded_year, description) 
        VALUES (?, ?, ?, ?, ?, ?, 2020, ?)
      `, [branch.name, branch.city, branch.address, branch.phone, branch.email, branch.industry, `${branch.name} - ${branch.city}, ${branch.country}`]);
      console.log(`✓ Created company: ${branch.name}`);

      // Create branch admin
      const hashedPassword = await bcrypt.hash(branch.admin.password, 10);
      await connection.query(`
        INSERT INTO users (username, password, email, full_name, role, status, approved_at) 
        VALUES (?, ?, ?, ?, 'Admin', 'Active', NOW())
      `, [branch.admin.username, hashedPassword, branch.admin.email, branch.admin.fullName]);
      console.log(`✓ Created admin: ${branch.admin.username} (${branch.admin.fullName})`);
      totalAdmins++;

      // Create employees for this branch
      const employeeIds = [];
      for (let i = 0; i < branch.employees.length; i++) {
        const emp = branch.employees[i];
        const [result] = await connection.query(`
          INSERT INTO employee (emp_name, email, phone, city, state, country, date_of_birth, gender, 
            hire_date, job_title, department, employment_type, status, nationality) 
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, DATE_SUB(NOW(), INTERVAL ? MONTH), ?, ?, 'Full-time', 'Active', ?)
        `, [emp.name, emp.email, emp.phone, branch.city, branch.state, branch.country, emp.dob, emp.gender, 
            Math.floor(Math.random() * 36) + 6, emp.job_title, emp.department, branch.country === 'India' ? 'Indian' : branch.country === 'UAE' ? 'Emirati' : 'British']);
        
        employeeIds.push(result.insertId);
        totalEmployees++;
      }
      console.log(`✓ Created ${branch.employees.length} employees`);

      // Assign employees to company with salaries
      for (let i = 0; i < employeeIds.length; i++) {
        const salary = branch.salaryBase + Math.floor(Math.random() * 30000);
        await connection.query(`
          INSERT INTO works (emp_id, company_name, salary) VALUES (?, ?, ?)
        `, [employeeIds[i], branch.name, salary]);
      }
      console.log(`✓ Assigned employees to ${branch.name} with salaries`);

      // Set up management hierarchy (first employee manages others)
      if (employeeIds.length > 1) {
        for (let i = 1; i < employeeIds.length; i++) {
          await connection.query(`
            INSERT INTO manages (emp_id, manager_id) VALUES (?, ?)
          `, [employeeIds[i], employeeIds[0]]);
        }
        console.log(`✓ Set up management hierarchy`);
      }

      // Add some dependents
      if (employeeIds.length > 0) {
        const dependentNames = branch.city === 'Malappuram' ? ['Amina', 'Hassan', 'Zainab'] :
                               branch.city === 'Kochi' ? ['Anu', 'Krishna', 'Radha'] :
                               branch.city === 'Bangalore' ? ['Kavya', 'Arjun', 'Sneha'] :
                               branch.city === 'Dubai' ? ['Layla', 'Khalid', 'Noura'] :
                               ['Emily', 'George', 'Lucy'];
        
        await connection.query(`
          INSERT INTO dependent (emp_id, dependent_name, relationship, gender, is_emergency_contact) 
          VALUES (?, ?, 'Spouse', 'Female', TRUE)
        `, [employeeIds[0], dependentNames[0]]);
        
        if (employeeIds.length > 2) {
          await connection.query(`
            INSERT INTO dependent (emp_id, dependent_name, relationship, gender, is_emergency_contact) 
            VALUES (?, ?, 'Child', 'Male', FALSE)
          `, [employeeIds[2], dependentNames[1]]);
        }
        console.log(`✓ Added dependents`);
      }
    }

    // Update default settings for multi-currency support
    await connection.query(`DELETE FROM settings WHERE setting_key IN ('currency', 'currency_symbol')`);
    await connection.query(`
      INSERT INTO settings (setting_key, setting_value) VALUES 
      ('currency', 'INR'),
      ('currency_symbol', '₹'),
      ('supported_currencies', 'INR,AED,GBP')
      ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)
    `);
    console.log('\n✓ Updated default currency settings');

    console.log('\n========================================');
    console.log('  Branch Setup Complete!');
    console.log('========================================');
    console.log(`\nSummary:`);
    console.log(`  - Branches created: ${branches.length}`);
    console.log(`  - Branch admins created: ${totalAdmins}`);
    console.log(`  - Employees created: ${totalEmployees}`);
    console.log(`\nBranch Details:`);
    
    for (const branch of branches) {
      console.log(`\n  ${branch.name} (${branch.city}, ${branch.country})`);
      console.log(`    Currency: ${branch.currency} (${branch.currencySymbol})`);
      console.log(`    Admin: ${branch.admin.username} / ${branch.admin.password}`);
      console.log(`    Email: ${branch.email}`);
    }

    console.log('\n\nMain Admin: admin / admin123');
    console.log('\nAll emails use @26-07.com domain');

  } catch (error) {
    console.error('Error setting up branches:', error);
    throw error;
  } finally {
    await connection.end();
  }
}

// Run if called directly
if (require.main === module) {
  setupBranches()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = { setupBranches, branches };
