const db = require('../database/connection');

class Company {
  // Get all companies
  static async getAll() {
    const [rows] = await db.query(`
      SELECT c.*, 
        (SELECT COUNT(*) FROM works w WHERE w.company_name = c.company_name) as employee_count,
        (SELECT AVG(w.salary) FROM works w WHERE w.company_name = c.company_name) as avg_salary
      FROM company c
      ORDER BY c.company_name
    `);
    return rows;
  }

  // Get company by name
  static async getByName(companyName) {
    const [rows] = await db.query(`
      SELECT c.*,
        (SELECT COUNT(*) FROM works w WHERE w.company_name = c.company_name) as employee_count,
        (SELECT SUM(w.salary) FROM works w WHERE w.company_name = c.company_name) as total_salary,
        (SELECT AVG(w.salary) FROM works w WHERE w.company_name = c.company_name) as avg_salary
      FROM company c
      WHERE c.company_name = ?
    `, [companyName]);
    return rows[0];
  }

  // Create new company
  static async create(companyData) {
    const { company_name, city } = companyData;
    const [result] = await db.query(`
      INSERT INTO company (company_name, city) VALUES (?, ?)
    `, [company_name, city]);
    return result.affectedRows;
  }

  // Update company
  static async update(oldName, companyData) {
    const { company_name, city } = companyData;
    const [result] = await db.query(`
      UPDATE company SET company_name = ?, city = ? WHERE company_name = ?
    `, [company_name, city, oldName]);
    return result.affectedRows;
  }

  // Delete company
  static async delete(companyName) {
    const [result] = await db.query('DELETE FROM company WHERE company_name = ?', [companyName]);
    return result.affectedRows;
  }

  // Get employees working at company
  static async getEmployees(companyName) {
    const [rows] = await db.query(`
      SELECT e.*, w.salary
      FROM employee e
      INNER JOIN works w ON e.emp_id = w.emp_id
      WHERE w.company_name = ?
      ORDER BY e.emp_name
    `, [companyName]);
    return rows;
  }

  // Search companies
  static async search(searchTerm) {
    const [rows] = await db.query(`
      SELECT c.*,
        (SELECT COUNT(*) FROM works w WHERE w.company_name = c.company_name) as employee_count
      FROM company c
      WHERE c.company_name LIKE ? OR c.city LIKE ?
      ORDER BY c.company_name
    `, [`%${searchTerm}%`, `%${searchTerm}%`]);
    return rows;
  }

  // Get companies by city
  static async getByCity(city) {
    const [rows] = await db.query(`
      SELECT c.*,
        (SELECT COUNT(*) FROM works w WHERE w.company_name = c.company_name) as employee_count
      FROM company c
      WHERE c.city = ?
      ORDER BY c.company_name
    `, [city]);
    return rows;
  }

  // Get all unique cities
  static async getCities() {
    const [rows] = await db.query('SELECT DISTINCT city FROM company ORDER BY city');
    return rows.map(r => r.city);
  }
}

module.exports = Company;
