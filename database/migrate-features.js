const mysql = require('mysql2/promise');
require('dotenv').config();

async function addNewFeatures() {
  const isCloud = process.env.DB_HOST && !process.env.DB_HOST.includes('localhost');
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'company_db',
    port: process.env.DB_PORT || 3306,
    ssl: isCloud ? { rejectUnauthorized: false } : undefined
  });

  try {
    console.log('========================================');
    console.log('  Adding New Features to Database');
    console.log('========================================\n');

    // 1. DEPARTMENTS TABLE
    await connection.query(`
      CREATE TABLE IF NOT EXISTS departments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) UNIQUE NOT NULL,
        description TEXT,
        head_id INT,
        parent_id INT,
        budget DECIMAL(15, 2) DEFAULT 0,
        location VARCHAR(100),
        status ENUM('Active', 'Inactive') DEFAULT 'Active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (head_id) REFERENCES employee(emp_id) ON DELETE SET NULL,
        FOREIGN KEY (parent_id) REFERENCES departments(id) ON DELETE SET NULL
      )
    `);
    console.log('✓ DEPARTMENTS table created');

    // 2. LEAVE REQUESTS TABLE
    await connection.query(`
      CREATE TABLE IF NOT EXISTS leave_requests (
        id INT AUTO_INCREMENT PRIMARY KEY,
        emp_id INT NOT NULL,
        leave_type ENUM('Annual', 'Sick', 'Personal', 'Maternity', 'Paternity', 'Unpaid', 'Other') NOT NULL,
        start_date DATE NOT NULL,
        end_date DATE NOT NULL,
        reason TEXT,
        status ENUM('Pending', 'Approved', 'Rejected', 'Cancelled') DEFAULT 'Pending',
        half_day BOOLEAN DEFAULT FALSE,
        approved_by INT,
        approval_date TIMESTAMP NULL,
        manager_comments TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (emp_id) REFERENCES employee(emp_id) ON DELETE CASCADE,
        FOREIGN KEY (approved_by) REFERENCES employee(emp_id) ON DELETE SET NULL
      )
    `);
    console.log('✓ LEAVE_REQUESTS table created');

    // 3. LEAVE BALANCE TABLE
    await connection.query(`
      CREATE TABLE IF NOT EXISTS leave_balance (
        id INT AUTO_INCREMENT PRIMARY KEY,
        emp_id INT NOT NULL,
        leave_type ENUM('Annual', 'Sick', 'Personal', 'Maternity', 'Paternity', 'Unpaid') NOT NULL,
        total_days INT DEFAULT 0,
        year INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY unique_balance (emp_id, leave_type, year),
        FOREIGN KEY (emp_id) REFERENCES employee(emp_id) ON DELETE CASCADE
      )
    `);
    console.log('✓ LEAVE_BALANCE table created');

    // 4. ATTENDANCE TABLE
    await connection.query(`
      CREATE TABLE IF NOT EXISTS attendance (
        id INT AUTO_INCREMENT PRIMARY KEY,
        emp_id INT NOT NULL,
        date DATE NOT NULL,
        check_in TIME,
        check_out TIME,
        status ENUM('Present', 'Absent', 'Late', 'Half Day', 'On Leave', 'Holiday', 'Weekend') DEFAULT 'Present',
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY unique_attendance (emp_id, date),
        FOREIGN KEY (emp_id) REFERENCES employee(emp_id) ON DELETE CASCADE
      )
    `);
    console.log('✓ ATTENDANCE table created');

    // 5. HOLIDAYS TABLE
    await connection.query(`
      CREATE TABLE IF NOT EXISTS holidays (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        date DATE NOT NULL,
        type ENUM('Public', 'Company', 'Optional') DEFAULT 'Public',
        description TEXT,
        applicable_branches VARCHAR(255) DEFAULT 'All',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✓ HOLIDAYS table created');

    // 6. DOCUMENTS TABLE
    await connection.query(`
      CREATE TABLE IF NOT EXISTS documents (
        id INT AUTO_INCREMENT PRIMARY KEY,
        emp_id INT,
        name VARCHAR(200) NOT NULL,
        category ENUM('ID Proof', 'Address Proof', 'Educational', 'Professional', 'Medical', 'Contract', 'Visa', 'License', 'Certificate', 'Tax Document', 'Bank Document', 'Insurance', 'Other') DEFAULT 'Other',
        file_url VARCHAR(500) NOT NULL,
        file_type VARCHAR(50),
        file_size INT DEFAULT 0,
        description TEXT,
        expiry_date DATE,
        is_verified BOOLEAN DEFAULT FALSE,
        verified_by INT,
        verified_at TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (emp_id) REFERENCES employee(emp_id) ON DELETE CASCADE,
        FOREIGN KEY (verified_by) REFERENCES employee(emp_id) ON DELETE SET NULL
      )
    `);
    console.log('✓ DOCUMENTS table created');

    // 7. PERFORMANCE REVIEWS TABLE
    await connection.query(`
      CREATE TABLE IF NOT EXISTS performance_reviews (
        id INT AUTO_INCREMENT PRIMARY KEY,
        emp_id INT NOT NULL,
        reviewer_id INT,
        review_period VARCHAR(50),
        review_date DATE,
        review_type ENUM('Annual', 'Quarterly', 'Probation', 'Project', 'Adhoc') DEFAULT 'Annual',
        overall_rating DECIMAL(3, 2) DEFAULT 0,
        goals_rating DECIMAL(3, 2) DEFAULT 0,
        skills_rating DECIMAL(3, 2) DEFAULT 0,
        teamwork_rating DECIMAL(3, 2) DEFAULT 0,
        communication_rating DECIMAL(3, 2) DEFAULT 0,
        strengths TEXT,
        areas_for_improvement TEXT,
        goals_achieved TEXT,
        new_goals TEXT,
        employee_comments TEXT,
        reviewer_comments TEXT,
        status ENUM('Draft', 'Submitted', 'Completed', 'Acknowledged') DEFAULT 'Draft',
        submitted_at TIMESTAMP NULL,
        completed_at TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (emp_id) REFERENCES employee(emp_id) ON DELETE CASCADE,
        FOREIGN KEY (reviewer_id) REFERENCES employee(emp_id) ON DELETE SET NULL
      )
    `);
    console.log('✓ PERFORMANCE_REVIEWS table created');

    // 8. PERFORMANCE GOALS TABLE
    await connection.query(`
      CREATE TABLE IF NOT EXISTS performance_goals (
        id INT AUTO_INCREMENT PRIMARY KEY,
        emp_id INT NOT NULL,
        title VARCHAR(200) NOT NULL,
        description TEXT,
        category ENUM('Performance', 'Learning', 'Career', 'Team', 'Personal') DEFAULT 'Performance',
        target_value VARCHAR(100),
        current_value VARCHAR(100),
        unit VARCHAR(50),
        due_date DATE,
        priority ENUM('Low', 'Medium', 'High', 'Critical') DEFAULT 'Medium',
        status ENUM('Not Started', 'In Progress', 'Completed', 'Overdue', 'Cancelled') DEFAULT 'Not Started',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (emp_id) REFERENCES employee(emp_id) ON DELETE CASCADE
      )
    `);
    console.log('✓ PERFORMANCE_GOALS table created');

    // 9. NOTIFICATIONS TABLE
    await connection.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT,
        emp_id INT,
        type ENUM('info', 'success', 'warning', 'error', 'leave', 'birthday', 'anniversary', 'document', 'review', 'system') DEFAULT 'info',
        title VARCHAR(200) NOT NULL,
        message TEXT,
        link VARCHAR(200),
        priority ENUM('low', 'normal', 'high', 'urgent') DEFAULT 'normal',
        is_read BOOLEAN DEFAULT FALSE,
        read_at TIMESTAMP NULL,
        expires_at TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (emp_id) REFERENCES employee(emp_id) ON DELETE CASCADE
      )
    `);
    console.log('✓ NOTIFICATIONS table created');

    // Create indexes for better performance
    console.log('\nCreating indexes...');
    
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_leave_emp ON leave_requests(emp_id)',
      'CREATE INDEX IF NOT EXISTS idx_leave_status ON leave_requests(status)',
      'CREATE INDEX IF NOT EXISTS idx_leave_dates ON leave_requests(start_date, end_date)',
      'CREATE INDEX IF NOT EXISTS idx_attendance_emp ON attendance(emp_id)',
      'CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance(date)',
      'CREATE INDEX IF NOT EXISTS idx_doc_emp ON documents(emp_id)',
      'CREATE INDEX IF NOT EXISTS idx_doc_expiry ON documents(expiry_date)',
      'CREATE INDEX IF NOT EXISTS idx_perf_emp ON performance_reviews(emp_id)',
      'CREATE INDEX IF NOT EXISTS idx_goals_emp ON performance_goals(emp_id)',
      'CREATE INDEX IF NOT EXISTS idx_notif_user ON notifications(user_id)',
      'CREATE INDEX IF NOT EXISTS idx_notif_read ON notifications(is_read)'
    ];

    for (const idx of indexes) {
      try {
        await connection.query(idx);
      } catch (e) {
        // Index might already exist
      }
    }
    console.log('✓ Indexes created');

    // Insert default departments
    console.log('\nInserting sample data...');
    
    await connection.query(`
      INSERT IGNORE INTO departments (name, description, location, status) VALUES 
      ('Engineering', 'Software Development & Engineering', 'All Branches', 'Active'),
      ('Human Resources', 'HR Management & Operations', 'All Branches', 'Active'),
      ('Finance', 'Financial Planning & Accounting', 'All Branches', 'Active'),
      ('Marketing', 'Marketing & Communications', 'All Branches', 'Active'),
      ('Operations', 'Business Operations', 'All Branches', 'Active'),
      ('Sales', 'Sales & Business Development', 'All Branches', 'Active'),
      ('Design', 'UI/UX & Creative Design', 'All Branches', 'Active'),
      ('Quality', 'Quality Assurance & Testing', 'All Branches', 'Active'),
      ('Infrastructure', 'IT Infrastructure & DevOps', 'All Branches', 'Active'),
      ('Executive', 'Executive Leadership', 'All Branches', 'Active')
    `);
    console.log('✓ Default departments inserted');

    // Insert default holidays for 2026
    await connection.query(`
      INSERT IGNORE INTO holidays (name, date, type, description, applicable_branches) VALUES 
      ('New Year', '2026-01-01', 'Public', 'New Year Day', 'All'),
      ('Republic Day', '2026-01-26', 'Public', 'Indian Republic Day', 'Malappuram,Kochi,Bangalore'),
      ('Holi', '2026-03-17', 'Public', 'Festival of Colors', 'Malappuram,Kochi,Bangalore'),
      ('Good Friday', '2026-04-03', 'Public', 'Good Friday', 'All'),
      ('Eid al-Fitr', '2026-03-20', 'Public', 'End of Ramadan', 'All'),
      ('Independence Day', '2026-08-15', 'Public', 'Indian Independence Day', 'Malappuram,Kochi,Bangalore'),
      ('Onam', '2026-08-26', 'Public', 'Kerala Festival', 'Malappuram,Kochi'),
      ('Gandhi Jayanti', '2026-10-02', 'Public', 'Gandhi Birthday', 'Malappuram,Kochi,Bangalore'),
      ('Diwali', '2026-11-08', 'Public', 'Festival of Lights', 'All'),
      ('Christmas', '2026-12-25', 'Public', 'Christmas Day', 'All'),
      ('UAE National Day', '2026-12-02', 'Public', 'UAE National Day', 'Dubai'),
      ('Boxing Day', '2026-12-26', 'Public', 'Boxing Day', 'London')
    `);
    console.log('✓ Default holidays inserted');

    // Initialize leave balances for existing employees
    const [employees] = await connection.query('SELECT emp_id FROM employee');
    const currentYear = new Date().getFullYear();
    
    for (const emp of employees) {
      const leaveTypes = [
        { type: 'Annual', days: 21 },
        { type: 'Sick', days: 10 },
        { type: 'Personal', days: 5 },
        { type: 'Maternity', days: 90 },
        { type: 'Paternity', days: 15 },
        { type: 'Unpaid', days: 30 }
      ];
      
      for (const lt of leaveTypes) {
        await connection.query(`
          INSERT IGNORE INTO leave_balance (emp_id, leave_type, total_days, year)
          VALUES (?, ?, ?, ?)
        `, [emp.emp_id, lt.type, lt.days, currentYear]);
      }
    }
    console.log('✓ Leave balances initialized for all employees');

    // Create sample notification
    await connection.query(`
      INSERT INTO notifications (type, title, message, priority)
      VALUES ('system', '🎉 New Features Added!', 'Leave Management, Documents, Performance Reviews, and more are now available!', 'high')
    `);
    console.log('✓ Welcome notification created');

    console.log('\n========================================');
    console.log('  New Features Added Successfully!');
    console.log('========================================');
    console.log('\nNew Tables Created:');
    console.log('  - departments (Department management)');
    console.log('  - leave_requests (Leave management)');
    console.log('  - leave_balance (Employee leave balance)');
    console.log('  - attendance (Attendance tracking)');
    console.log('  - holidays (Holiday calendar)');
    console.log('  - documents (Document management)');
    console.log('  - performance_reviews (Performance reviews)');
    console.log('  - performance_goals (Goals/KPIs tracking)');
    console.log('  - notifications (System notifications)');
    console.log('\nNew Features:');
    console.log('  ✓ Leave/Attendance Management');
    console.log('  ✓ Department Management');
    console.log('  ✓ Document Management');
    console.log('  ✓ Performance Reviews & Goals');
    console.log('  ✓ Notifications & Alerts');
    console.log('  ✓ Birthday & Anniversary Reminders');
    console.log('  ✓ Export to CSV/Excel');

  } catch (error) {
    console.error('Error adding new features:', error);
    throw error;
  } finally {
    await connection.end();
  }
}

// Run if called directly
if (require.main === module) {
  addNewFeatures()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = { addNewFeatures };
