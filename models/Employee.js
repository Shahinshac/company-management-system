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
}

module.exports = Employee;
