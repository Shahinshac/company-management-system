const pool = require('../database/connection');

class Dependent {
  // Get all dependents
  static async getAll() {
    const [rows] = await pool.query(`
      SELECT d.*, e.emp_name 
      FROM dependent d
      LEFT JOIN employee e ON d.emp_id = e.emp_id
      ORDER BY e.emp_name, d.dependent_name
    `);
    return rows;
  }

  // Get dependents by employee ID
  static async getByEmployeeId(empId) {
    const [rows] = await pool.query(`
      SELECT * FROM dependent 
      WHERE emp_id = ?
      ORDER BY 
        CASE relationship 
          WHEN 'Spouse' THEN 1 
          WHEN 'Child' THEN 2 
          WHEN 'Parent' THEN 3 
          WHEN 'Sibling' THEN 4 
          ELSE 5 
        END,
        dependent_name
    `, [empId]);
    return rows;
  }

  // Get single dependent by ID
  static async getById(id) {
    const [rows] = await pool.query(`
      SELECT d.*, e.emp_name 
      FROM dependent d
      LEFT JOIN employee e ON d.emp_id = e.emp_id
      WHERE d.id = ?
    `, [id]);
    return rows[0];
  }

  // Create new dependent
  static async create(data) {
    const [result] = await pool.query(`
      INSERT INTO dependent (
        emp_id, dependent_name, relationship, date_of_birth, 
        gender, phone, email, address, is_emergency_contact, 
        health_insurance_id, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      data.emp_id,
      data.dependent_name,
      data.relationship,
      data.date_of_birth || null,
      data.gender || null,
      data.phone || null,
      data.email || null,
      data.address || null,
      data.is_emergency_contact || false,
      data.health_insurance_id || null,
      data.notes || null
    ]);
    return { id: result.insertId, ...data };
  }

  // Update dependent
  static async update(id, data) {
    const [result] = await pool.query(`
      UPDATE dependent SET
        dependent_name = COALESCE(?, dependent_name),
        relationship = COALESCE(?, relationship),
        date_of_birth = ?,
        gender = ?,
        phone = ?,
        email = ?,
        address = ?,
        is_emergency_contact = COALESCE(?, is_emergency_contact),
        health_insurance_id = ?,
        notes = ?
      WHERE id = ?
    `, [
      data.dependent_name,
      data.relationship,
      data.date_of_birth || null,
      data.gender || null,
      data.phone || null,
      data.email || null,
      data.address || null,
      data.is_emergency_contact,
      data.health_insurance_id || null,
      data.notes || null,
      id
    ]);
    return result.affectedRows > 0;
  }

  // Delete dependent
  static async delete(id) {
    const [result] = await pool.query('DELETE FROM dependent WHERE id = ?', [id]);
    return result.affectedRows > 0;
  }

  // Delete all dependents for an employee
  static async deleteByEmployeeId(empId) {
    const [result] = await pool.query('DELETE FROM dependent WHERE emp_id = ?', [empId]);
    return result.affectedRows;
  }

  // Get dependents count by employee
  static async getCountByEmployee(empId) {
    const [rows] = await pool.query(
      'SELECT COUNT(*) as count FROM dependent WHERE emp_id = ?',
      [empId]
    );
    return rows[0].count;
  }

  // Get emergency contacts for employee
  static async getEmergencyContacts(empId) {
    const [rows] = await pool.query(`
      SELECT * FROM dependent 
      WHERE emp_id = ? AND is_emergency_contact = TRUE
      ORDER BY dependent_name
    `, [empId]);
    return rows;
  }

  // Get all children dependents (for benefits calculation)
  static async getChildrenByEmployee(empId) {
    const [rows] = await pool.query(`
      SELECT * FROM dependent 
      WHERE emp_id = ? AND relationship = 'Child'
      ORDER BY date_of_birth DESC
    `, [empId]);
    return rows;
  }

  // Get dependents statistics
  static async getStats() {
    const [rows] = await pool.query(`
      SELECT 
        COUNT(*) as total_dependents,
        SUM(CASE WHEN relationship = 'Spouse' THEN 1 ELSE 0 END) as spouses,
        SUM(CASE WHEN relationship = 'Child' THEN 1 ELSE 0 END) as children,
        SUM(CASE WHEN relationship = 'Parent' THEN 1 ELSE 0 END) as parents,
        SUM(CASE WHEN is_emergency_contact = TRUE THEN 1 ELSE 0 END) as emergency_contacts
      FROM dependent
    `);
    return rows[0];
  }

  // Get employees with most dependents
  static async getEmployeesWithMostDependents(limit = 10) {
    const [rows] = await pool.query(`
      SELECT 
        e.emp_id, e.emp_name, e.city,
        COUNT(d.id) as dependent_count,
        GROUP_CONCAT(d.dependent_name ORDER BY d.dependent_name SEPARATOR ', ') as dependents
      FROM employee e
      LEFT JOIN dependent d ON e.emp_id = d.emp_id
      GROUP BY e.emp_id
      HAVING dependent_count > 0
      ORDER BY dependent_count DESC
      LIMIT ?
    `, [limit]);
    return rows;
  }
}

module.exports = Dependent;
