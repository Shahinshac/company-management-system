const db = require('../database/connection');

class Employee {
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
    const { Name, Gender, Address, Dob, Doj, Department_No, Since, Salary, Email, Phone, Photo } = employeeData;
    const [result] = await db.query(`
      INSERT INTO EMPLOYEE (Name, Gender, Address, Dob, Doj, Department_No, Since, Salary, Email, Phone, Photo)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [Name, Gender, Address, Dob, Doj, Department_No, Since, Salary, Email, Phone, Photo]);
    return result.insertId;
  }

  // Update employee
  static async update(id, employeeData) {
    const { Name, Gender, Address, Dob, Doj, Department_No, Since, Salary, Email, Phone, Photo } = employeeData;
    const [result] = await db.query(`
      UPDATE EMPLOYEE 
      SET Name = ?, Gender = ?, Address = ?, Dob = ?, Doj = ?, 
          Department_No = ?, Since = ?, Salary = ?, Email = ?, Phone = ?, Photo = ?
      WHERE Id = ?
    `, [Name, Gender, Address, Dob, Doj, Department_No, Since, Salary, Email, Phone, Photo, id]);
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
  static async createAuthEmployee({ Username, Email, Role = 'Employee', passwordHash }) {
    const [result] = await db.query(`
      INSERT INTO EMPLOYEE (Username, Email, Role, Password, Status)
      VALUES (?, ?, ?, ?, 'Active')
    `, [Username, Email, Role, passwordHash]);
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
    const bcrypt = require('bcryptjs');
    return await bcrypt.compare(plainPassword, hashedPassword);
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
    const [rows] = await db.query('SELECT Id, Name, Username, Email, Role, Status, created_at FROM EMPLOYEE ORDER BY created_at DESC');
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

module.exports = Employee;
