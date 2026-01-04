const mysql = require('mysql2/promise');
require('dotenv').config();

async function seedFeaturesData() {
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
    console.log('  Seeding Live Data for New Features');
    console.log('========================================\n');

    // Get all employees
    const [employees] = await connection.query('SELECT emp_id, emp_name, department, city FROM employee');
    console.log(`Found ${employees.length} employees\n`);

    // ==================== ATTENDANCE DATA ====================
    console.log('Generating attendance data...');
    
    // Generate attendance for the last 30 days
    const today = new Date();
    for (const emp of employees) {
      for (let i = 0; i < 30; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        
        // Skip weekends
        if (date.getDay() === 0 || date.getDay() === 6) continue;
        
        // Random status with weighted probability
        const rand = Math.random();
        let status, checkIn, checkOut;
        
        if (rand < 0.85) {
          status = 'Present';
          checkIn = `09:${String(Math.floor(Math.random() * 15)).padStart(2, '0')}:00`;
          checkOut = `18:${String(Math.floor(Math.random() * 30)).padStart(2, '0')}:00`;
        } else if (rand < 0.92) {
          status = 'Late';
          checkIn = `09:${String(30 + Math.floor(Math.random() * 30)).padStart(2, '0')}:00`;
          checkOut = `18:${String(Math.floor(Math.random() * 30)).padStart(2, '0')}:00`;
        } else if (rand < 0.97) {
          status = 'Half Day';
          checkIn = '09:00:00';
          checkOut = '13:00:00';
        } else {
          status = 'Absent';
          checkIn = null;
          checkOut = null;
        }
        
        const dateStr = date.toISOString().split('T')[0];
        
        await connection.query(`
          INSERT IGNORE INTO attendance (emp_id, date, check_in, check_out, status)
          VALUES (?, ?, ?, ?, ?)
        `, [emp.emp_id, dateStr, checkIn, checkOut, status]);
      }
    }
    console.log('✓ Attendance data generated (30 days for all employees)');

    // ==================== LEAVE REQUESTS ====================
    console.log('\nGenerating leave requests...');
    
    const leaveTypes = ['Annual', 'Sick', 'Personal', 'Maternity', 'Paternity'];
    const leaveStatuses = ['Approved', 'Approved', 'Approved', 'Pending', 'Rejected'];
    const leaveReasons = [
      'Family vacation planned',
      'Medical appointment',
      'Personal emergency',
      'Wedding ceremony',
      'Home renovation work',
      'Child school event',
      'Doctor visit',
      'Travel plans',
      'Moving to new house',
      'Family function'
    ];
    
    for (const emp of employees) {
      // Each employee gets 2-4 leave requests
      const numLeaves = 2 + Math.floor(Math.random() * 3);
      
      for (let i = 0; i < numLeaves; i++) {
        const startOffset = -60 + Math.floor(Math.random() * 90); // -60 to +30 days from today
        const duration = 1 + Math.floor(Math.random() * 5); // 1-5 days
        
        const startDate = new Date(today);
        startDate.setDate(startDate.getDate() + startOffset);
        
        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + duration - 1);
        
        const leaveType = leaveTypes[Math.floor(Math.random() * leaveTypes.length)];
        const status = startOffset < 0 ? leaveStatuses[Math.floor(Math.random() * 3)] : leaveStatuses[Math.floor(Math.random() * leaveStatuses.length)];
        const reason = leaveReasons[Math.floor(Math.random() * leaveReasons.length)];
        
        // Get a random manager for approval
        const approvedBy = status !== 'Pending' ? employees[Math.floor(Math.random() * employees.length)].emp_id : null;
        const approvalDate = status !== 'Pending' ? new Date().toISOString().slice(0, 19).replace('T', ' ') : null;
        
        await connection.query(`
          INSERT INTO leave_requests (emp_id, leave_type, start_date, end_date, reason, status, approved_by, approval_date)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          emp.emp_id,
          leaveType,
          startDate.toISOString().split('T')[0],
          endDate.toISOString().split('T')[0],
          reason,
          status,
          approvedBy,
          approvalDate
        ]);
      }
    }
    console.log('✓ Leave requests generated');

    // ==================== DOCUMENTS ====================
    console.log('\nGenerating documents...');
    
    const docTemplates = [
      { name: 'Passport', category: 'ID Proof', expiry: true },
      { name: 'National ID Card', category: 'ID Proof', expiry: true },
      { name: 'Driving License', category: 'License', expiry: true },
      { name: 'Work Visa', category: 'Visa', expiry: true },
      { name: 'Employment Contract', category: 'Contract', expiry: false },
      { name: 'Degree Certificate', category: 'Educational', expiry: false },
      { name: 'Professional Certification', category: 'Certificate', expiry: true },
      { name: 'Health Insurance Card', category: 'Insurance', expiry: true },
      { name: 'Tax Registration', category: 'Tax Document', expiry: false },
      { name: 'Bank Account Details', category: 'Bank Document', expiry: false }
    ];
    
    for (const emp of employees) {
      // Each employee gets 3-6 documents
      const numDocs = 3 + Math.floor(Math.random() * 4);
      const selectedDocs = docTemplates.sort(() => Math.random() - 0.5).slice(0, numDocs);
      
      for (const doc of selectedDocs) {
        let expiryDate = null;
        if (doc.expiry) {
          const expiry = new Date(today);
          expiry.setDate(expiry.getDate() + Math.floor(Math.random() * 365 * 2) - 30); // -30 days to +2 years
          expiryDate = expiry.toISOString().split('T')[0];
        }
        
        const isVerified = Math.random() > 0.3;
        const verifiedAt = isVerified ? new Date().toISOString().slice(0, 19).replace('T', ' ') : null;
        
        await connection.query(`
          INSERT INTO documents (emp_id, name, category, file_url, file_type, description, expiry_date, is_verified, verified_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          emp.emp_id,
          `${emp.emp_name} - ${doc.name}`,
          doc.category,
          `https://documents.26-07.com/${emp.emp_id}/${doc.name.toLowerCase().replace(/ /g, '-')}.pdf`,
          'pdf',
          `${doc.name} document for ${emp.emp_name}`,
          expiryDate,
          isVerified,
          verifiedAt
        ]);
      }
    }
    console.log('✓ Documents generated');

    // ==================== PERFORMANCE REVIEWS ====================
    console.log('\nGenerating performance reviews...');
    
    const reviewPeriods = ['Q4 2025', 'Q3 2025', 'Annual 2025', 'Q2 2025'];
    const reviewTypes = ['Quarterly', 'Annual', 'Probation'];
    const strengths = [
      'Excellent technical skills and problem-solving ability',
      'Strong team player with great communication',
      'Consistently meets deadlines and delivers quality work',
      'Shows initiative and takes ownership of projects',
      'Great attention to detail and thorough documentation',
      'Adapts well to changes and learns quickly',
      'Mentors junior team members effectively',
      'Proactive in identifying and resolving issues'
    ];
    const improvements = [
      'Could improve time management skills',
      'Should participate more in team meetings',
      'Needs to work on presentation skills',
      'Could benefit from additional technical training',
      'Should focus on work-life balance',
      'Could take more initiative in cross-team collaboration',
      'Needs to improve documentation habits',
      'Should delegate tasks more effectively'
    ];
    
    for (const emp of employees) {
      // Each employee gets 1-2 reviews
      const numReviews = 1 + Math.floor(Math.random() * 2);
      
      for (let i = 0; i < numReviews; i++) {
        const reviewDate = new Date(today);
        reviewDate.setDate(reviewDate.getDate() - Math.floor(Math.random() * 180));
        
        const overallRating = (3 + Math.random() * 2).toFixed(2);
        const goalsRating = (3 + Math.random() * 2).toFixed(2);
        const skillsRating = (3 + Math.random() * 2).toFixed(2);
        const teamworkRating = (3 + Math.random() * 2).toFixed(2);
        const commRating = (3 + Math.random() * 2).toFixed(2);
        
        // Get a random manager as reviewer
        const reviewer = employees[Math.floor(Math.random() * employees.length)];
        
        const status = Math.random() > 0.3 ? 'Completed' : (Math.random() > 0.5 ? 'Submitted' : 'Draft');
        const completedAt = status === 'Completed' ? reviewDate.toISOString().slice(0, 19).replace('T', ' ') : null;
        
        await connection.query(`
          INSERT INTO performance_reviews (
            emp_id, reviewer_id, review_period, review_date, review_type,
            overall_rating, goals_rating, skills_rating, teamwork_rating, communication_rating,
            strengths, areas_for_improvement, goals_achieved, new_goals, status, completed_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          emp.emp_id,
          reviewer.emp_id,
          reviewPeriods[i],
          reviewDate.toISOString().split('T')[0],
          reviewTypes[Math.floor(Math.random() * reviewTypes.length)],
          overallRating,
          goalsRating,
          skillsRating,
          teamworkRating,
          commRating,
          strengths[Math.floor(Math.random() * strengths.length)],
          improvements[Math.floor(Math.random() * improvements.length)],
          'Successfully completed assigned projects and met quarterly targets',
          'Focus on skill development and take on leadership responsibilities',
          status,
          completedAt
        ]);
      }
    }
    console.log('✓ Performance reviews generated');

    // ==================== PERFORMANCE GOALS ====================
    console.log('\nGenerating performance goals...');
    
    const goalTemplates = [
      { title: 'Complete Advanced Training Course', category: 'Learning', target: '1', unit: 'course' },
      { title: 'Increase Code Coverage', category: 'Performance', target: '80', unit: '%' },
      { title: 'Mentor Junior Developers', category: 'Team', target: '2', unit: 'mentees' },
      { title: 'Reduce Bug Count', category: 'Performance', target: '10', unit: 'bugs/month' },
      { title: 'Improve Customer Satisfaction Score', category: 'Performance', target: '4.5', unit: 'rating' },
      { title: 'Complete Certification', category: 'Career', target: '1', unit: 'certification' },
      { title: 'Lead Project Delivery', category: 'Career', target: '2', unit: 'projects' },
      { title: 'Improve Response Time', category: 'Performance', target: '24', unit: 'hours' },
      { title: 'Conduct Team Workshops', category: 'Team', target: '4', unit: 'workshops' },
      { title: 'Document Best Practices', category: 'Learning', target: '5', unit: 'documents' }
    ];
    
    const priorities = ['Low', 'Medium', 'High', 'Critical'];
    const goalStatuses = ['Not Started', 'In Progress', 'In Progress', 'Completed', 'Completed'];
    
    for (const emp of employees) {
      // Each employee gets 2-4 goals
      const numGoals = 2 + Math.floor(Math.random() * 3);
      const selectedGoals = goalTemplates.sort(() => Math.random() - 0.5).slice(0, numGoals);
      
      for (const goal of selectedGoals) {
        const dueDate = new Date(today);
        dueDate.setDate(dueDate.getDate() + Math.floor(Math.random() * 180)); // 0-6 months
        
        const status = goalStatuses[Math.floor(Math.random() * goalStatuses.length)];
        const currentValue = status === 'Completed' ? goal.target : 
          (status === 'In Progress' ? String(Math.floor(parseFloat(goal.target) * Math.random() * 0.8)) : '0');
        
        await connection.query(`
          INSERT INTO performance_goals (
            emp_id, title, description, category, target_value, current_value, 
            unit, due_date, priority, status
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          emp.emp_id,
          goal.title,
          `Goal for ${emp.emp_name}: ${goal.title}`,
          goal.category,
          goal.target,
          currentValue,
          goal.unit,
          dueDate.toISOString().split('T')[0],
          priorities[Math.floor(Math.random() * priorities.length)],
          status
        ]);
      }
    }
    console.log('✓ Performance goals generated');

    // ==================== NOTIFICATIONS ====================
    console.log('\nGenerating notifications...');
    
    const notificationTemplates = [
      { type: 'leave', title: 'Leave Request Approved', message: 'Your annual leave request has been approved', priority: 'normal' },
      { type: 'birthday', title: '🎂 Birthday Celebration', message: 'Team birthday celebration at 3 PM in the cafeteria', priority: 'low' },
      { type: 'system', title: 'System Maintenance', message: 'Scheduled maintenance on Sunday 2 AM - 4 AM', priority: 'high' },
      { type: 'review', title: 'Performance Review Due', message: 'Please complete your self-assessment by end of week', priority: 'high' },
      { type: 'document', title: 'Document Expiring', message: 'Your visa document will expire in 30 days', priority: 'urgent' },
      { type: 'anniversary', title: '🎉 Work Anniversary', message: 'Congratulations on completing another year with us!', priority: 'low' },
      { type: 'info', title: 'New Policy Update', message: 'Please review the updated leave policy', priority: 'normal' },
      { type: 'success', title: 'Goal Completed', message: 'You have successfully completed your quarterly goal', priority: 'normal' }
    ];
    
    // Get users
    const [users] = await connection.query('SELECT id FROM users');
    
    for (const user of users) {
      // Each user gets 3-6 notifications
      const numNotifs = 3 + Math.floor(Math.random() * 4);
      
      for (let i = 0; i < numNotifs; i++) {
        const notif = notificationTemplates[Math.floor(Math.random() * notificationTemplates.length)];
        const isRead = Math.random() > 0.4;
        const createdAt = new Date(today);
        createdAt.setDate(createdAt.getDate() - Math.floor(Math.random() * 14));
        const readAt = isRead ? new Date().toISOString().slice(0, 19).replace('T', ' ') : null;
        const createdAtStr = createdAt.toISOString().slice(0, 19).replace('T', ' ');
        
        await connection.query(`
          INSERT INTO notifications (user_id, type, title, message, priority, is_read, read_at, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          user.id,
          notif.type,
          notif.title,
          notif.message,
          notif.priority,
          isRead,
          readAt,
          createdAtStr
        ]);
      }
    }
    console.log('✓ Notifications generated');

    // ==================== UPDATE DEPARTMENTS WITH HEADS ====================
    console.log('\nUpdating department heads...');
    
    const deptHeads = {
      'Engineering': employees.find(e => e.department === 'Engineering')?.emp_id,
      'Human Resources': employees.find(e => e.department === 'Human Resources')?.emp_id,
      'Finance': employees.find(e => e.department === 'Finance')?.emp_id,
      'Marketing': employees.find(e => e.department === 'Marketing')?.emp_id,
      'Operations': employees.find(e => e.department === 'Operations')?.emp_id,
      'Design': employees.find(e => e.department === 'Design')?.emp_id,
      'Quality': employees.find(e => e.department === 'Quality')?.emp_id,
      'Executive': employees.find(e => e.department === 'Executive')?.emp_id,
      'Management': employees.find(e => e.department === 'Management')?.emp_id,
      'Analytics': employees.find(e => e.department === 'Analytics')?.emp_id
    };
    
    for (const [dept, headId] of Object.entries(deptHeads)) {
      if (headId) {
        await connection.query(`
          UPDATE departments SET head_id = ? WHERE name = ?
        `, [headId, dept]);
      }
    }
    console.log('✓ Department heads assigned');

    // ==================== SUMMARY ====================
    const [attCount] = await connection.query('SELECT COUNT(*) as count FROM attendance');
    const [leaveCount] = await connection.query('SELECT COUNT(*) as count FROM leave_requests');
    const [docCount] = await connection.query('SELECT COUNT(*) as count FROM documents');
    const [reviewCount] = await connection.query('SELECT COUNT(*) as count FROM performance_reviews');
    const [goalCount] = await connection.query('SELECT COUNT(*) as count FROM performance_goals');
    const [notifCount] = await connection.query('SELECT COUNT(*) as count FROM notifications');

    console.log('\n========================================');
    console.log('  Live Data Seeding Complete!');
    console.log('========================================');
    console.log(`\n📊 Data Summary:`);
    console.log(`   • Attendance Records: ${attCount[0].count}`);
    console.log(`   • Leave Requests: ${leaveCount[0].count}`);
    console.log(`   • Documents: ${docCount[0].count}`);
    console.log(`   • Performance Reviews: ${reviewCount[0].count}`);
    console.log(`   • Performance Goals: ${goalCount[0].count}`);
    console.log(`   • Notifications: ${notifCount[0].count}`);
    console.log('\n✅ All features now have live data!');

  } catch (error) {
    console.error('Error seeding data:', error);
    throw error;
  } finally {
    await connection.end();
  }
}

// Run if called directly
if (require.main === module) {
  seedFeaturesData()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = { seedFeaturesData };
