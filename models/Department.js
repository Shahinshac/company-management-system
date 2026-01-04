const db = require('../database/connection');

class Department {
  // Get all departments
  static async getAll() {
    const [rows] = await db.query(`
      SELECT d.*, 
        head.emp_name as head_name,
        head.photo_url as head_photo,
        (SELECT COUNT(*) FROM employee WHERE department = d.name) as employee_count,
        (SELECT SUM(w.salary) FROM employee e 
         JOIN works w ON e.emp_id = w.emp_id 
         WHERE e.department = d.name) as total_salary
      FROM departments d
      LEFT JOIN employee head ON d.head_id = head.emp_id
      ORDER BY d.name
    `);
    return rows;
  }

  // Get department by ID
  static async getById(id) {
    const [rows] = await db.query(`
      SELECT d.*, head.emp_name as head_name
      FROM departments d
      LEFT JOIN employee head ON d.head_id = head.emp_id
      WHERE d.id = ?
    `, [id]);
    return rows[0];
  }

  // Get department by name
  static async getByName(name) {
    const [rows] = await db.query(`
      SELECT d.*, head.emp_name as head_name
      FROM departments d
      LEFT JOIN employee head ON d.head_id = head.emp_id
      WHERE d.name = ?
    `, [name]);
    return rows[0];
  }

  // Get employees in department
  static async getEmployees(departmentName) {
    const [rows] = await db.query(`
      SELECT e.*, w.salary, w.company_name
      FROM employee e
      LEFT JOIN works w ON e.emp_id = w.emp_id
      WHERE e.department = ?
      ORDER BY e.emp_name
    `, [departmentName]);
    return rows;
  }

  // Create department
  static async create(data) {
    const [result] = await db.query(`
      INSERT INTO departments (name, description, head_id, parent_id, budget, location, status)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [
      data.name,
      data.description || null,
      data.head_id || null,
      data.parent_id || null,
      data.budget || 0,
      data.location || null,
      data.status || 'Active'
    ]);
    return { id: result.insertId, ...data };
  }

  // Update department
  static async update(id, data) {
    const fields = [];
    const values = [];

    if (data.name !== undefined) { fields.push('name = ?'); values.push(data.name); }
    if (data.description !== undefined) { fields.push('description = ?'); values.push(data.description); }
    if (data.head_id !== undefined) { fields.push('head_id = ?'); values.push(data.head_id || null); }
    if (data.parent_id !== undefined) { fields.push('parent_id = ?'); values.push(data.parent_id || null); }
    if (data.budget !== undefined) { fields.push('budget = ?'); values.push(data.budget); }
    if (data.location !== undefined) { fields.push('location = ?'); values.push(data.location); }
    if (data.status !== undefined) { fields.push('status = ?'); values.push(data.status); }

    if (fields.length === 0) return false;

    values.push(id);
    const [result] = await db.query(
      `UPDATE departments SET ${fields.join(', ')} WHERE id = ?`,
      values
    );
    return result.affectedRows > 0;
  }

  // Delete department
  static async delete(id) {
    const [result] = await db.query('DELETE FROM departments WHERE id = ?', [id]);
    return result.affectedRows > 0;
  }

  // Get department hierarchy
  static async getHierarchy() {
    const [rows] = await db.query(`
      SELECT d.*, 
        head.emp_name as head_name,
        parent.name as parent_name,
        (SELECT COUNT(*) FROM employee WHERE department = d.name) as employee_count
      FROM departments d
      LEFT JOIN employee head ON d.head_id = head.emp_id
      LEFT JOIN departments parent ON d.parent_id = parent.id
      ORDER BY d.parent_id IS NULL DESC, d.name
    `);
    return rows;
  }

  // Get department stats
  static async getStats() {
    const [stats] = await db.query(`
      SELECT 
        (SELECT COUNT(*) FROM departments) as total_departments,
        (SELECT COUNT(*) FROM departments WHERE status = 'Active') as active_departments,
        (SELECT SUM(budget) FROM departments) as total_budget,
        (SELECT COUNT(DISTINCT department) FROM employee WHERE department IS NOT NULL) as departments_with_employees
    `);
    return stats[0];
  }
}

module.exports = Department;
