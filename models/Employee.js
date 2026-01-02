const db = require('../database/connection');

class Employee {
  // Get all employees with their work info
  static async getAll() {
    const [rows] = await db.query(`
      SELECT e.*,
        GROUP_CONCAT(DISTINCT w.company_name) as companies,
        SUM(w.salary) as total_salary,
        COUNT(DISTINCT w.company_name) as company_count,
        (SELECT emp_name FROM employee m 
         INNER JOIN manages mg ON m.emp_id = mg.manager_id 
         WHERE mg.emp_id = e.emp_id) as manager_name,
        (SELECT manager_id FROM manages WHERE emp_id = e.emp_id) as manager_id
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

  // Create new employee with all fields
  static async create(employeeData) {
    const {
      emp_name, email, phone, street_no, street_name, city, state, zip_code, country,
      date_of_birth, gender, marital_status, nationality, national_id, photo_url,
      hire_date, job_title, department, employment_type, status,
      emergency_contact_name, emergency_contact_phone, emergency_contact_relation,
      bank_name, bank_account_number, bank_routing_number
    } = employeeData;
    
    const [result] = await db.query(`
      INSERT INTO employee (
        emp_name, email, phone, street_no, street_name, city, state, zip_code, country,
        date_of_birth, gender, marital_status, nationality, national_id, photo_url,
        hire_date, job_title, department, employment_type, status,
        emergency_contact_name, emergency_contact_phone, emergency_contact_relation,
        bank_name, bank_account_number, bank_routing_number
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      emp_name, email || null, phone || null, street_no || null, street_name || null,
      city || null, state || null, zip_code || null, country || null,
      date_of_birth || null, gender || null, marital_status || null,
      nationality || null, national_id || null, photo_url || null,
      hire_date || null, job_title || null, department || null,
      employment_type || 'Full-time', status || 'Active',
      emergency_contact_name || null, emergency_contact_phone || null, emergency_contact_relation || null,
      bank_name || null, bank_account_number || null, bank_routing_number || null
    ]);
    return result.insertId;
  }

  // Update employee with all fields
  static async update(id, employeeData) {
    const {
      emp_name, email, phone, street_no, street_name, city, state, zip_code, country,
      date_of_birth, gender, marital_status, nationality, national_id, photo_url,
      hire_date, job_title, department, employment_type, status,
      emergency_contact_name, emergency_contact_phone, emergency_contact_relation,
      bank_name, bank_account_number, bank_routing_number, manager_id
    } = employeeData;
    
    const [result] = await db.query(`
      UPDATE employee SET
        emp_name = ?, email = ?, phone = ?, street_no = ?, street_name = ?,
        city = ?, state = ?, zip_code = ?, country = ?,
        date_of_birth = ?, gender = ?, marital_status = ?, nationality = ?,
        national_id = ?, photo_url = ?, hire_date = ?, job_title = ?,
        department = ?, employment_type = ?, status = ?,
        emergency_contact_name = ?, emergency_contact_phone = ?, emergency_contact_relation = ?,
        bank_name = ?, bank_account_number = ?, bank_routing_number = ?
      WHERE emp_id = ?
    `, [
      emp_name, email || null, phone || null, street_no || null, street_name || null,
      city || null, state || null, zip_code || null, country || null,
      date_of_birth || null, gender || null, marital_status || null,
      nationality || null, national_id || null, photo_url || null,
      hire_date || null, job_title || null, department || null,
      employment_type || 'Full-time', status || 'Active',
      emergency_contact_name || null, emergency_contact_phone || null, emergency_contact_relation || null,
      bank_name || null, bank_account_number || null, bank_routing_number || null, id
    ]);
    
    // Handle manager relationship
    if (manager_id !== undefined) {
      // Delete existing management relationship
      await db.query('DELETE FROM manages WHERE emp_id = ?', [id]);
      // Create new relationship if manager specified
      if (manager_id) {
        await db.query('INSERT INTO manages (emp_id, manager_id) VALUES (?, ?)', [id, manager_id]);
      }
    }
    
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
