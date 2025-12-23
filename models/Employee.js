const db = require('../database/connection');

class Employee {
  static async ensureBranchColumn() {
    try {
      const [cols] = await db.query("SHOW COLUMNS FROM EMPLOYEE LIKE 'Branch'");
      if (!cols || cols.length === 0) {
        await db.query("ALTER TABLE EMPLOYEE ADD COLUMN Branch VARCHAR(100) NULL AFTER Phone");
      }
    } catch (err) {
      console.warn('ensureBranchColumn warning:', err && err.message ? err.message : err);
    }
  }
  // Get all employees
  static async getAll() {
    const [rows] = await db.query(`
      SELECT e.*, d.Name as Department_Name 
      FROM EMPLOYEE e
      LEFT JOIN DEPARTMENT d ON e.Department_No = d.D_No
      ORDER BY e.Name
    `);
    return rows;
  }

  // Get employee by ID
  static async getById(id) {
    const [rows] = await db.query(`
      SELECT e.*, d.Name as Department_Name, d.Location as Department_Location
      FROM EMPLOYEE e
      LEFT JOIN DEPARTMENT d ON e.Department_No = d.D_No
      WHERE e.Id = ?
    `, [id]);
    return rows[0];
  }

  // Create new employee
  static async create(employeeData) {
    const { Name, Gender, Address, Dob, Doj, Department_No, Since, Salary, Email, Phone, Branch = null, Photo } = employeeData;
    await this.ensureBranchColumn();
    const [result] = await db.query(`
      INSERT INTO EMPLOYEE (Name, Gender, Address, Dob, Doj, Department_No, Since, Salary, Email, Phone, Branch, Photo)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [Name, Gender, Address, Dob, Doj, Department_No, Since, Salary, Email, Phone, Branch, Photo]);
    return result.insertId;
  }

  // Update employee
  static async update(id, employeeData) {
    const { Name, Gender, Address, Dob, Doj, Department_No, Since, Salary, Email, Phone, Branch = null, Photo } = employeeData;
    await this.ensureBranchColumn();
    const [result] = await db.query(`
      UPDATE EMPLOYEE 
      SET Name = ?, Gender = ?, Address = ?, Dob = ?, Doj = ?, 
          Department_No = ?, Since = ?, Salary = ?, Email = ?, Phone = ?, Branch = ?, Photo = ?
      WHERE Id = ?
    `, [Name, Gender, Address, Dob, Doj, Department_No, Since, Salary, Email, Phone, Branch, Photo, id]);
    return result.affectedRows;
  }

  // Delete employee
  static async delete(id) {
    const [result] = await db.query('DELETE FROM EMPLOYEE WHERE Id = ?', [id]);
    return result.affectedRows;
  }

  // Get employee projects
  static async getProjects(id) {
    const [rows] = await db.query(`
      SELECT p.*, w.Hours, w.Assignment_Date, w.Role
      FROM PROJECT p
      INNER JOIN WORKS_ON w ON p.P_No = w.Project_No
      WHERE w.Employee_Id = ?
    `, [id]);
    return rows;
  }

  // Get employee dependents
  static async getDependents(id) {
    const [rows] = await db.query(`
      SELECT * FROM DEPENDENT WHERE Employee_Id = ?
    `, [id]);
    return rows;
  }

  // Search employees
  static async search(searchTerm) {
    const [rows] = await db.query(`
      SELECT e.*, d.Name as Department_Name 
      FROM EMPLOYEE e
      LEFT JOIN DEPARTMENT d ON e.Department_No = d.D_No
      WHERE e.Name LIKE ? OR e.Email LIKE ? OR e.Phone LIKE ?
      ORDER BY e.Name
    `, [`%${searchTerm}%`, `%${searchTerm}%`, `%${searchTerm}%`]);
    return rows;
  }

  // Get employees by department
  static async getByDepartment(departmentNo) {
    const [rows] = await db.query(`
      SELECT e.*, d.Name as Department_Name 
      FROM EMPLOYEE e
      LEFT JOIN DEPARTMENT d ON e.Department_No = d.D_No
      WHERE e.Department_No = ?
      ORDER BY e.Name
    `, [departmentNo]);
    return rows;
  }

  // Assign employee to project
  static async assignToProject(employeeId, projectNo, hours, role) {
    const [result] = await db.query(`
      INSERT INTO WORKS_ON (Employee_Id, Project_No, Hours, Assignment_Date, Role)
      VALUES (?, ?, ?, CURDATE(), ?)
      ON DUPLICATE KEY UPDATE Hours = ?, Role = ?
    `, [employeeId, projectNo, hours, role, hours, role]);
    return result.affectedRows;
  }

  // Remove employee from project
  static async removeFromProject(employeeId, projectNo) {
    const [result] = await db.query(`
      DELETE FROM WORKS_ON WHERE Employee_Id = ? AND Project_No = ?
    `, [employeeId, projectNo]);
    return result.affectedRows;
  }

  // Authentication: find by username or email
  static async findByIdentifier(identifier) {
    const [rows] = await db.query('SELECT * FROM EMPLOYEE WHERE Username = ? OR Email = ? LIMIT 1', [identifier, identifier]);
    return rows[0];
  }

  // Create employee with authentication fields (used by admin to create accounts)
  static async createAuthEmployee({ Username, Email, Role = 'Employee', passwordHash, Branch = null, Name: ProvidedName }) {
    // Use Username as Name if Name not provided to satisfy NOT NULL constraint
    const Name = ProvidedName || Username;
    await this.ensureBranchColumn();
    // ForcePasswordChange defaults to 1 so admins must instruct users to change on first login
    const [result] = await db.query(`
      INSERT INTO EMPLOYEE (Name, Username, Email, Role, Password, Branch, Status, ForcePasswordChange)
      VALUES (?, ?, ?, ?, ?, ?, 'Active', 1)
    `, [Name, Username, Email, Role, passwordHash, Branch]);
    return result.insertId;
  }

  static async usernameExists(username) {
    const [rows] = await db.query('SELECT Id FROM EMPLOYEE WHERE Username = ?', [username]);
    return rows.length > 0;
  }

  static async emailExists(email) {
    const [rows] = await db.query('SELECT Id FROM EMPLOYEE WHERE Email = ?', [email]);
    return rows.length > 0;
  }

  static async verifyPassword(plainPassword, hashedPassword) {
    // If the stored password is missing or falsy, return false to avoid throwing in bcrypt
    if (!hashedPassword) return false;

    try {
      const bcrypt = require('bcryptjs');
      return await bcrypt.compare(plainPassword, hashedPassword);
    } catch (err) {
      console.error('Password verification error:', err);
      return false;
    }
  }

  static generateToken(employee) {
    const jwt = require('jsonwebtoken');
    return jwt.sign(
      { id: employee.Id, username: employee.Username, email: employee.Email, role: employee.Role },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: process.env.JWT_EXPIRE || '24h' }
    );
  }

  static async updatePassword(id, passwordHash) {
    const [result] = await db.query('UPDATE EMPLOYEE SET Password = ?, ForcePasswordChange = 0 WHERE Id = ?', [passwordHash, id]);
    return result.affectedRows > 0;
  }

  static async setForcePasswordChange(id, flag = 1) {
    const [result] = await db.query('UPDATE EMPLOYEE SET ForcePasswordChange = ? WHERE Id = ?', [flag, id]);
    return result.affectedRows > 0;
  }

  static async getAllUsers() {
    const args = Array.from(arguments);
    const branch = args[0] || null;
    if (branch) {
      const [rows] = await db.query('SELECT Id, Name, Username, Email, Role, Status, Branch, created_at FROM EMPLOYEE WHERE Branch = ? ORDER BY created_at DESC', [branch]);
      return rows;
    }
    const [rows] = await db.query('SELECT Id, Name, Username, Email, Role, Status, Branch, created_at FROM EMPLOYEE ORDER BY created_at DESC');
    return rows;
  }

  static async updateRole(id, role) {
    const [result] = await db.query('UPDATE EMPLOYEE SET Role = ? WHERE Id = ?', [role, id]);
    return result.affectedRows > 0;
  }

  static async setStatus(id, status) {
    const [result] = await db.query('UPDATE EMPLOYEE SET Status = ? WHERE Id = ?', [status, id]);
    return result.affectedRows > 0;
  }

  static async deleteEmployee(id) {
    const [result] = await db.query('DELETE FROM EMPLOYEE WHERE Id = ?', [id]);
    return result.affectedRows > 0;
  }
}

module.exports = Employee;
