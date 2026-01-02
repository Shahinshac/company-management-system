const db = require('../database/connection');

class Employee {
  // Get all employees with their work info
  static async getAll() {
    const [rows] = await db.query(`
      SELECT e.*,
        GROUP_CONCAT(DISTINCT w.company_name) as companies,
        SUM(w.salary) as total_salary,
        (SELECT emp_name FROM employee m 
         INNER JOIN manages mg ON m.emp_id = mg.manager_id 
         WHERE mg.emp_id = e.emp_id) as manager_name
      FROM employee e
      LEFT JOIN works w ON e.emp_id = w.emp_id
      GROUP BY e.emp_id
      ORDER BY e.emp_name
    `);
    return rows;
  }

  // Get employee by ID
  static async getById(id) {
    const [rows] = await db.query(`
      SELECT e.*,
        (SELECT emp_name FROM employee m 
         INNER JOIN manages mg ON m.emp_id = mg.manager_id 
         WHERE mg.emp_id = e.emp_id) as manager_name,
        (SELECT manager_id FROM manages WHERE emp_id = e.emp_id) as manager_id
      FROM employee e
      WHERE e.emp_id = ?
    `, [id]);
    return rows[0];
  }

  // Create new employee
  static async create(employeeData) {
    const { emp_name, street_no, city } = employeeData;
    const [result] = await db.query(`
      INSERT INTO employee (emp_name, street_no, city) VALUES (?, ?, ?)
    `, [emp_name, street_no || null, city || null]);
    return result.insertId;
  }

  // Update employee
  static async update(id, employeeData) {
    const { emp_name, street_no, city } = employeeData;
    const [result] = await db.query(`
      UPDATE employee SET emp_name = ?, street_no = ?, city = ? WHERE emp_id = ?
    `, [emp_name, street_no || null, city || null, id]);
    return result.affectedRows;
  }

  // Delete employee
  static async delete(id) {
    const [result] = await db.query('DELETE FROM employee WHERE emp_id = ?', [id]);
    return result.affectedRows;
  }

  // Search employees
  static async search(searchTerm) {
    const [rows] = await db.query(`
      SELECT e.*,
        GROUP_CONCAT(DISTINCT w.company_name) as companies,
        SUM(w.salary) as total_salary
      FROM employee e
      LEFT JOIN works w ON e.emp_id = w.emp_id
      WHERE e.emp_name LIKE ? OR e.city LIKE ? OR CAST(e.emp_id AS CHAR) LIKE ?
      GROUP BY e.emp_id
      ORDER BY e.emp_name
    `, [`%${searchTerm}%`, `%${searchTerm}%`, `%${searchTerm}%`]);
    return rows;
  }

  // Get employees by city
  static async getByCity(city) {
    const [rows] = await db.query(`
      SELECT e.*,
        GROUP_CONCAT(DISTINCT w.company_name) as companies
      FROM employee e
      LEFT JOIN works w ON e.emp_id = w.emp_id
      WHERE e.city = ?
      GROUP BY e.emp_id
      ORDER BY e.emp_name
    `, [city]);
    return rows;
  }

  // Get work history for employee
  static async getWorkHistory(id) {
    const [rows] = await db.query(`
      SELECT w.*, c.city as company_city
      FROM works w
      INNER JOIN company c ON w.company_name = c.company_name
      WHERE w.emp_id = ?
    `, [id]);
    return rows;
  }

  // Get subordinates (employees managed by this employee)
  static async getSubordinates(id) {
    const [rows] = await db.query(`
      SELECT e.*
      FROM employee e
      INNER JOIN manages m ON e.emp_id = m.emp_id
      WHERE m.manager_id = ?
      ORDER BY e.emp_name
    `, [id]);
    return rows;
  }

  // Get all unique cities
  static async getCities() {
    const [rows] = await db.query('SELECT DISTINCT city FROM employee WHERE city IS NOT NULL ORDER BY city');
    return rows.map(r => r.city);
  }

  // Get employees without managers
  static async getTopManagers() {
    const [rows] = await db.query(`
      SELECT e.*
      FROM employee e
      WHERE e.emp_id NOT IN (SELECT emp_id FROM manages)
      ORDER BY e.emp_name
    `);
    return rows;
  }
}

module.exports = Employee;
