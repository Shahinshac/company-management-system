const db = require('../database/connection');

class Report {
  // Get overall company statistics
  static async getOverallStats() {
    const [stats] = await db.query(`
      SELECT 
        (SELECT COUNT(*) FROM company) as total_companies,
        (SELECT COUNT(*) FROM employee) as total_employees,
        (SELECT COUNT(*) FROM works) as total_work_relations,
        (SELECT COUNT(DISTINCT manager_id) FROM manages) as total_managers,
        (SELECT SUM(salary) FROM works) as total_payroll,
        (SELECT AVG(salary) FROM works) as avg_salary,
        (SELECT MAX(salary) FROM works) as max_salary,
        (SELECT MIN(salary) FROM works WHERE salary > 0) as min_salary
    `);
    return stats[0];
  }

  // Get salary distribution by company
  static async getSalaryByCompany() {
    const [rows] = await db.query(`
      SELECT 
        c.company_name,
        c.city,
        COUNT(w.emp_id) as employee_count,
        SUM(w.salary) as total_salary,
        AVG(w.salary) as avg_salary,
        MAX(w.salary) as max_salary,
        MIN(w.salary) as min_salary
      FROM company c
      LEFT JOIN works w ON c.company_name = w.company_name
      GROUP BY c.company_name, c.city
      ORDER BY total_salary DESC
    `);
    return rows;
  }

  // Get salary distribution by city
  static async getSalaryByCity() {
    const [rows] = await db.query(`
      SELECT 
        e.city,
        COUNT(DISTINCT e.emp_id) as employee_count,
        SUM(w.salary) as total_salary,
        AVG(w.salary) as avg_salary
      FROM employee e
      LEFT JOIN works w ON e.emp_id = w.emp_id
      WHERE e.city IS NOT NULL
      GROUP BY e.city
      ORDER BY total_salary DESC
    `);
    return rows;
  }

  // Get top earners
  static async getTopEarners(limit = 10) {
    const [rows] = await db.query(`
      SELECT 
        e.emp_id,
        e.emp_name,
        e.city,
        SUM(w.salary) as total_salary,
        COUNT(w.company_name) as companies_count,
        GROUP_CONCAT(w.company_name) as companies
      FROM employee e
      INNER JOIN works w ON e.emp_id = w.emp_id
      GROUP BY e.emp_id
      ORDER BY total_salary DESC
      LIMIT ?
    `, [limit]);
    return rows;
  }

  // Get managers with most subordinates
  static async getTopManagers(limit = 10) {
    const [rows] = await db.query(`
      SELECT 
        e.emp_id,
        e.emp_name,
        e.city,
        COUNT(m.emp_id) as subordinate_count,
        GROUP_CONCAT(sub.emp_name) as subordinates
      FROM employee e
      INNER JOIN manages m ON e.emp_id = m.manager_id
      INNER JOIN employee sub ON m.emp_id = sub.emp_id
      GROUP BY e.emp_id
      ORDER BY subordinate_count DESC
      LIMIT ?
    `, [limit]);
    return rows;
  }

  // Get employees without work assignments
  static async getUnassignedEmployees() {
    const [rows] = await db.query(`
      SELECT e.*
      FROM employee e
      LEFT JOIN works w ON e.emp_id = w.emp_id
      WHERE w.emp_id IS NULL
      ORDER BY e.emp_name
    `);
    return rows;
  }

  // Get companies without employees
  static async getEmptyCompanies() {
    const [rows] = await db.query(`
      SELECT c.*
      FROM company c
      LEFT JOIN works w ON c.company_name = w.company_name
      WHERE w.company_name IS NULL
      ORDER BY c.company_name
    `);
    return rows;
  }

  // Get monthly payroll summary
  static async getPayrollSummary() {
    const [rows] = await db.query(`
      SELECT 
        company_name,
        COUNT(*) as employees,
        SUM(salary) as monthly_payroll,
        SUM(salary) * 12 as annual_payroll
      FROM works
      GROUP BY company_name
      ORDER BY monthly_payroll DESC
    `);
    return rows;
  }

  // Get employee growth (count by creation date)
  static async getEmployeeGrowth() {
    const [rows] = await db.query(`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as new_employees
      FROM employee
      GROUP BY DATE(created_at)
      ORDER BY date DESC
      LIMIT 30
    `);
    return rows;
  }
}

module.exports = Report;
