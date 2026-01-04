const db = require('../database/connection');

class Leave {
  // Get all leave requests
  static async getAll() {
    const [rows] = await db.query(`
      SELECT l.*, e.emp_name, e.department, e.photo_url,
        approver.emp_name as approver_name
      FROM leave_requests l
      JOIN employee e ON l.emp_id = e.emp_id
      LEFT JOIN employee approver ON l.approved_by = approver.emp_id
      ORDER BY l.created_at DESC
    `);
    return rows;
  }

  // Get leave requests by employee
  static async getByEmployee(empId) {
    const [rows] = await db.query(`
      SELECT l.*, approver.emp_name as approver_name
      FROM leave_requests l
      LEFT JOIN employee approver ON l.approved_by = approver.emp_id
      WHERE l.emp_id = ?
      ORDER BY l.created_at DESC
    `, [empId]);
    return rows;
  }

  // Get pending requests
  static async getPending() {
    const [rows] = await db.query(`
      SELECT l.*, e.emp_name, e.department, e.photo_url
      FROM leave_requests l
      JOIN employee e ON l.emp_id = e.emp_id
      WHERE l.status = 'Pending'
      ORDER BY l.created_at ASC
    `);
    return rows;
  }

  // Get single leave request
  static async getById(id) {
    const [rows] = await db.query(`
      SELECT l.*, e.emp_name, e.department
      FROM leave_requests l
      JOIN employee e ON l.emp_id = e.emp_id
      WHERE l.id = ?
    `, [id]);
    return rows[0];
  }

  // Create leave request
  static async create(data) {
    const [result] = await db.query(`
      INSERT INTO leave_requests (
        emp_id, leave_type, start_date, end_date, 
        reason, status, half_day
      ) VALUES (?, ?, ?, ?, ?, 'Pending', ?)
    `, [
      data.emp_id,
      data.leave_type,
      data.start_date,
      data.end_date,
      data.reason || null,
      data.half_day || false
    ]);
    return { id: result.insertId, ...data };
  }

  // Approve/Reject leave request
  static async updateStatus(id, status, approvedBy, comments = null) {
    const [result] = await db.query(`
      UPDATE leave_requests 
      SET status = ?, approved_by = ?, approval_date = NOW(), 
          manager_comments = ?
      WHERE id = ?
    `, [status, approvedBy, comments, id]);
    return result.affectedRows > 0;
  }

  // Delete leave request
  static async delete(id) {
    const [result] = await db.query('DELETE FROM leave_requests WHERE id = ?', [id]);
    return result.affectedRows > 0;
  }

  // Get leave balance for employee
  static async getBalance(empId, year = new Date().getFullYear()) {
    const [rows] = await db.query(`
      SELECT 
        lb.*,
        COALESCE((
          SELECT SUM(DATEDIFF(end_date, start_date) + 1)
          FROM leave_requests
          WHERE emp_id = lb.emp_id 
            AND leave_type = lb.leave_type
            AND status = 'Approved'
            AND YEAR(start_date) = ?
        ), 0) as used_days
      FROM leave_balance lb
      WHERE lb.emp_id = ? AND lb.year = ?
    `, [year, empId, year]);
    return rows;
  }

  // Initialize leave balance for employee
  static async initializeBalance(empId, year = new Date().getFullYear()) {
    const defaultBalances = [
      { type: 'Annual', days: 21 },
      { type: 'Sick', days: 10 },
      { type: 'Personal', days: 5 },
      { type: 'Maternity', days: 90 },
      { type: 'Paternity', days: 15 },
      { type: 'Unpaid', days: 30 }
    ];

    for (const balance of defaultBalances) {
      await db.query(`
        INSERT IGNORE INTO leave_balance (emp_id, leave_type, total_days, year)
        VALUES (?, ?, ?, ?)
      `, [empId, balance.type, balance.days, year]);
    }
  }

  // Get leave statistics
  static async getStats(year = new Date().getFullYear()) {
    const [stats] = await db.query(`
      SELECT 
        COUNT(*) as total_requests,
        SUM(CASE WHEN status = 'Pending' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN status = 'Approved' THEN 1 ELSE 0 END) as approved,
        SUM(CASE WHEN status = 'Rejected' THEN 1 ELSE 0 END) as rejected,
        SUM(CASE WHEN status = 'Approved' THEN DATEDIFF(end_date, start_date) + 1 ELSE 0 END) as total_leave_days
      FROM leave_requests
      WHERE YEAR(start_date) = ?
    `, [year]);
    return stats[0];
  }

  // Get attendance records
  static async getAttendance(empId, month, year) {
    const [rows] = await db.query(`
      SELECT * FROM attendance
      WHERE emp_id = ? AND MONTH(date) = ? AND YEAR(date) = ?
      ORDER BY date DESC
    `, [empId, month, year]);
    return rows;
  }

  // Get all attendance records (for overview)
  static async getAllAttendance(month, year) {
    const [rows] = await db.query(`
      SELECT a.*, e.emp_name, e.department, e.photo_url
      FROM attendance a
      JOIN employee e ON a.emp_id = e.emp_id
      WHERE MONTH(a.date) = ? AND YEAR(a.date) = ?
      ORDER BY a.date DESC, e.emp_name
    `, [month, year]);
    return rows;
  }

  // Get overall attendance summary
  static async getOverallAttendanceSummary(month, year) {
    const [summary] = await db.query(`
      SELECT 
        COUNT(DISTINCT emp_id) as total_employees,
        COUNT(*) as total_records,
        SUM(CASE WHEN status = 'Present' THEN 1 ELSE 0 END) as present,
        SUM(CASE WHEN status = 'Absent' THEN 1 ELSE 0 END) as absent,
        SUM(CASE WHEN status = 'Late' THEN 1 ELSE 0 END) as late,
        SUM(CASE WHEN status = 'Half Day' THEN 1 ELSE 0 END) as half_day
      FROM attendance
      WHERE MONTH(date) = ? AND YEAR(date) = ?
    `, [month, year]);
    return summary[0];
  }

  // Record attendance
  static async recordAttendance(data) {
    const [result] = await db.query(`
      INSERT INTO attendance (emp_id, date, check_in, check_out, status, notes)
      VALUES (?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE 
        check_in = COALESCE(VALUES(check_in), check_in),
        check_out = VALUES(check_out),
        status = VALUES(status),
        notes = VALUES(notes)
    `, [
      data.emp_id,
      data.date,
      data.check_in || null,
      data.check_out || null,
      data.status || 'Present',
      data.notes || null
    ]);
    return result.affectedRows > 0;
  }

  // Get attendance summary
  static async getAttendanceSummary(empId, month, year) {
    const [summary] = await db.query(`
      SELECT 
        COUNT(*) as total_days,
        SUM(CASE WHEN status = 'Present' THEN 1 ELSE 0 END) as present,
        SUM(CASE WHEN status = 'Absent' THEN 1 ELSE 0 END) as absent,
        SUM(CASE WHEN status = 'Late' THEN 1 ELSE 0 END) as late,
        SUM(CASE WHEN status = 'Half Day' THEN 1 ELSE 0 END) as half_day
      FROM attendance
      WHERE emp_id = ? AND MONTH(date) = ? AND YEAR(date) = ?
    `, [empId, month, year]);
    return summary[0];
  }

  // Get holidays
  static async getHolidays(year = new Date().getFullYear()) {
    const [rows] = await db.query(`
      SELECT * FROM holidays
      WHERE YEAR(date) = ?
      ORDER BY date ASC
    `, [year]);
    return rows;
  }

  // Add holiday
  static async addHoliday(data) {
    const [result] = await db.query(`
      INSERT INTO holidays (name, date, type, description, applicable_branches)
      VALUES (?, ?, ?, ?, ?)
    `, [
      data.name,
      data.date,
      data.type || 'Public',
      data.description || null,
      data.applicable_branches || 'All'
    ]);
    return { id: result.insertId, ...data };
  }

  // Delete holiday
  static async deleteHoliday(id) {
    const [result] = await db.query('DELETE FROM holidays WHERE id = ?', [id]);
    return result.affectedRows > 0;
  }
}

module.exports = Leave;
