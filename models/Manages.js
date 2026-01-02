const db = require('../database/connection');

class Manages {
  // Get all management relationships
  static async getAll() {
    const [rows] = await db.query(`
      SELECT m.*, 
        e.emp_name as employee_name,
        e.city as employee_city,
        mgr.emp_name as manager_name,
        mgr.city as manager_city
      FROM manages m
      INNER JOIN employee e ON m.emp_id = e.emp_id
      INNER JOIN employee mgr ON m.manager_id = mgr.emp_id
      ORDER BY mgr.emp_name, e.emp_name
    `);
    return rows;
  }

  // Get manager for an employee
  static async getManager(empId) {
    const [rows] = await db.query(`
      SELECT m.*, mgr.emp_name as manager_name, mgr.city as manager_city
      FROM manages m
      INNER JOIN employee mgr ON m.manager_id = mgr.emp_id
      WHERE m.emp_id = ?
    `, [empId]);
    return rows[0];
  }

  // Get subordinates for a manager
  static async getSubordinates(managerId) {
    const [rows] = await db.query(`
      SELECT m.*, e.emp_name as employee_name, e.city as employee_city
      FROM manages m
      INNER JOIN employee e ON m.emp_id = e.emp_id
      WHERE m.manager_id = ?
      ORDER BY e.emp_name
    `, [managerId]);
    return rows;
  }

  // Create management relationship
  static async create(empId, managerId) {
    // Check if relationship already exists
    const existing = await this.getManager(empId);
    if (existing) {
      // Update existing
      return await this.update(empId, managerId);
    }
    
    const [result] = await db.query(`
      INSERT INTO manages (emp_id, manager_id) VALUES (?, ?)
    `, [empId, managerId]);
    return result.affectedRows;
  }

  // Update management relationship
  static async update(empId, newManagerId) {
    const [result] = await db.query(`
      UPDATE manages SET manager_id = ? WHERE emp_id = ?
    `, [newManagerId, empId]);
    return result.affectedRows;
  }

  // Delete management relationship
  static async delete(empId) {
    const [result] = await db.query('DELETE FROM manages WHERE emp_id = ?', [empId]);
    return result.affectedRows;
  }

  // Get management hierarchy (all levels)
  static async getHierarchy(managerId) {
    // Get direct reports and their reports recursively
    const hierarchy = [];
    const directReports = await this.getSubordinates(managerId);
    
    for (const report of directReports) {
      const subordinates = await this.getHierarchy(report.emp_id);
      hierarchy.push({
        ...report,
        subordinates
      });
    }
    
    return hierarchy;
  }

  // Get all managers (employees who manage someone)
  static async getAllManagers() {
    const [rows] = await db.query(`
      SELECT DISTINCT e.*,
        (SELECT COUNT(*) FROM manages m WHERE m.manager_id = e.emp_id) as subordinate_count
      FROM employee e
      INNER JOIN manages m ON e.emp_id = m.manager_id
      ORDER BY subordinate_count DESC, e.emp_name
    `);
    return rows;
  }

  // Count subordinates for a manager
  static async countSubordinates(managerId) {
    const [rows] = await db.query(`
      SELECT COUNT(*) as count FROM manages WHERE manager_id = ?
    `, [managerId]);
    return rows[0].count;
  }
}

module.exports = Manages;
