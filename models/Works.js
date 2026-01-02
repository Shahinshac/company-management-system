const db = require('../database/connection');

class Works {
  // Get all work relationships
  static async getAll() {
    const [rows] = await db.query(`
      SELECT w.*, e.emp_name, c.city as company_city
      FROM works w
      INNER JOIN employee e ON w.emp_id = e.emp_id
      INNER JOIN company c ON w.company_name = c.company_name
      ORDER BY e.emp_name, w.company_name
    `);
    return rows;
  }

  // Get specific work relationship
  static async get(empId, companyName) {
    const [rows] = await db.query(`
      SELECT w.*, e.emp_name, c.city as company_city
      FROM works w
      INNER JOIN employee e ON w.emp_id = e.emp_id
      INNER JOIN company c ON w.company_name = c.company_name
      WHERE w.emp_id = ? AND w.company_name = ?
    `, [empId, companyName]);
    return rows[0];
  }

  // Create work relationship
  static async create(worksData) {
    const { emp_id, company_name, salary } = worksData;
    const [result] = await db.query(`
      INSERT INTO works (emp_id, company_name, salary) VALUES (?, ?, ?)
    `, [emp_id, company_name, salary || 0]);
    return result.affectedRows;
  }

  // Update work relationship (salary)
  static async update(empId, companyName, salary) {
    const [result] = await db.query(`
      UPDATE works SET salary = ? WHERE emp_id = ? AND company_name = ?
    `, [salary, empId, companyName]);
    return result.affectedRows;
  }

  // Delete work relationship
  static async delete(empId, companyName) {
    const [result] = await db.query(`
      DELETE FROM works WHERE emp_id = ? AND company_name = ?
    `, [empId, companyName]);
    return result.affectedRows;
  }

  // Delete all work relationships for an employee
  static async deleteByEmployee(empId) {
    const [result] = await db.query('DELETE FROM works WHERE emp_id = ?', [empId]);
    return result.affectedRows;
  }

  // Delete all work relationships for a company
  static async deleteByCompany(companyName) {
    const [result] = await db.query('DELETE FROM works WHERE company_name = ?', [companyName]);
    return result.affectedRows;
  }

  // Get employees with salary above threshold
  static async getHighEarners(minSalary) {
    const [rows] = await db.query(`
      SELECT w.*, e.emp_name, c.city as company_city
      FROM works w
      INNER JOIN employee e ON w.emp_id = e.emp_id
      INNER JOIN company c ON w.company_name = c.company_name
      WHERE w.salary >= ?
      ORDER BY w.salary DESC
    `, [minSalary]);
    return rows;
  }

  // Get salary statistics by company
  static async getSalaryStatsByCompany() {
    const [rows] = await db.query(`
      SELECT 
        w.company_name,
        COUNT(*) as employee_count,
        MIN(w.salary) as min_salary,
        MAX(w.salary) as max_salary,
        AVG(w.salary) as avg_salary,
        SUM(w.salary) as total_salary
      FROM works w
      GROUP BY w.company_name
      ORDER BY total_salary DESC
    `);
    return rows;
  }

  // Get total salary for an employee across all companies
  static async getTotalSalary(empId) {
    const [rows] = await db.query(`
      SELECT SUM(salary) as total_salary FROM works WHERE emp_id = ?
    `, [empId]);
    return rows[0]?.total_salary || 0;
  }
}

module.exports = Works;
