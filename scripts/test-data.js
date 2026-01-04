const mysql = require('mysql2/promise');
require('dotenv').config();

async function test() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 3306,
    ssl: { rejectUnauthorized: false }
  });
  
  console.log('\n=== Testing Database Queries ===\n');
  
  // Test Departments
  const [depts] = await conn.query('SELECT d.*, head.emp_name as head_name FROM departments d LEFT JOIN employee head ON d.head_id = head.emp_id ORDER BY d.name');
  console.log('Departments:', depts.length);
  if (depts.length > 0) console.log('  Sample:', depts[0].name, '- Head:', depts[0].head_name || 'None');
  
  // Test Leaves
  const [leaves] = await conn.query('SELECT l.*, e.emp_name FROM leave_requests l JOIN employee e ON l.emp_id = e.emp_id ORDER BY l.created_at DESC LIMIT 5');
  console.log('\nLeave Requests:', leaves.length, '(showing 5)');
  if (leaves.length > 0) console.log('  Sample:', leaves[0].emp_name, '-', leaves[0].leave_type, '-', leaves[0].status);
  
  // Test Attendance
  const [att] = await conn.query('SELECT a.*, e.emp_name FROM attendance a JOIN employee e ON a.emp_id = e.emp_id ORDER BY a.date DESC LIMIT 5');
  console.log('\nAttendance Records:', att.length, '(showing 5)');
  if (att.length > 0) console.log('  Sample:', att[0].emp_name, '-', att[0].date, '-', att[0].status);
  
  // Test Documents
  const [docs] = await conn.query('SELECT d.*, e.emp_name FROM documents d LEFT JOIN employee e ON d.emp_id = e.emp_id ORDER BY d.created_at DESC LIMIT 5');
  console.log('\nDocuments:', docs.length, '(showing 5)');
  if (docs.length > 0) console.log('  Sample:', docs[0].name, '-', docs[0].category);
  
  // Test Performance Reviews
  const [reviews] = await conn.query('SELECT p.*, e.emp_name FROM performance_reviews p JOIN employee e ON p.emp_id = e.emp_id ORDER BY p.review_date DESC LIMIT 5');
  console.log('\nPerformance Reviews:', reviews.length, '(showing 5)');
  if (reviews.length > 0) console.log('  Sample:', reviews[0].emp_name, '-', reviews[0].review_period, '-', reviews[0].overall_rating);
  
  // Test Goals
  const [goals] = await conn.query('SELECT g.*, e.emp_name FROM performance_goals g JOIN employee e ON g.emp_id = e.emp_id LIMIT 5');
  console.log('\nPerformance Goals:', goals.length, '(showing 5)');
  if (goals.length > 0) console.log('  Sample:', goals[0].emp_name, '-', goals[0].title, '-', goals[0].status);
  
  await conn.end();
  console.log('\n=== All queries successful! ===');
}

test().catch(console.error);
