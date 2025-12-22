const db = require('../database/connection');

class Department {
  // Get all departments
  static async getAll() {
    const [rows] = await db.query(`
      SELECT d.*, 
             e.Name as Manager_Name,
             (SELECT COUNT(*) FROM EMPLOYEE WHERE Department_No = d.D_No) as Employee_Count,
             (SELECT COUNT(*) FROM PROJECT WHERE Department_No = d.D_No) as Project_Count
      FROM DEPARTMENT d
      LEFT JOIN EMPLOYEE e ON d.Manager_Id = e.Id
      ORDER BY d.Name
    `);
    return rows;
  }

  // Get department by ID
  static async getById(dNo) {
    const [rows] = await db.query(`
      SELECT d.*, 
             e.Name as Manager_Name, e.Email as Manager_Email,
             (SELECT COUNT(*) FROM EMPLOYEE WHERE Department_No = d.D_No) as Employee_Count,
             (SELECT COUNT(*) FROM PROJECT WHERE Department_No = d.D_No) as Project_Count
      FROM DEPARTMENT d
      LEFT JOIN EMPLOYEE e ON d.Manager_Id = e.Id
      WHERE d.D_No = ?
    `, [dNo]);
    return rows[0];
  }

  // Create new department
  static async create(departmentData) {
    const { D_No, Name, Location, Manager_Id, Manager_Start_Date } = departmentData;
    const [result] = await db.query(`
      INSERT INTO DEPARTMENT (D_No, Name, Location, Manager_Id, Manager_Start_Date)
      VALUES (?, ?, ?, ?, ?)
    `, [D_No, Name, Location, Manager_Id, Manager_Start_Date]);
    return D_No;
  }

  // Update department
  static async update(dNo, departmentData) {
    const { Name, Location, Manager_Id, Manager_Start_Date } = departmentData;
    const [result] = await db.query(`
      UPDATE DEPARTMENT 
      SET Name = ?, Location = ?, Manager_Id = ?, Manager_Start_Date = ?
      WHERE D_No = ?
    `, [Name, Location, Manager_Id, Manager_Start_Date, dNo]);
    return result.affectedRows;
  }

  // Delete department
  static async delete(dNo) {
    const [result] = await db.query('DELETE FROM DEPARTMENT WHERE D_No = ?', [dNo]);
    return result.affectedRows;
  }

  // Get department employees
  static async getEmployees(dNo) {
    const [rows] = await db.query(`
      SELECT * FROM EMPLOYEE WHERE Department_No = ?
      ORDER BY Name
    `, [dNo]);
    return rows;
  }

  // Get department projects
  static async getProjects(dNo) {
    const [rows] = await db.query(`
      SELECT * FROM PROJECT WHERE Department_No = ?
      ORDER BY Name
    `, [dNo]);
    return rows;
  }

  // Get department statistics
  static async getStatistics(dNo) {
    const [stats] = await db.query(`
      SELECT 
        d.D_No,
        d.Name,
        COUNT(DISTINCT e.Id) as Total_Employees,
        COUNT(DISTINCT p.P_No) as Total_Projects,
        AVG(e.Salary) as Average_Salary,
        SUM(p.Budget) as Total_Budget
      FROM DEPARTMENT d
      LEFT JOIN EMPLOYEE e ON d.D_No = e.Department_No
      LEFT JOIN PROJECT p ON d.D_No = p.Department_No
      WHERE d.D_No = ?
      GROUP BY d.D_No, d.Name
    `, [dNo]);
    return stats[0];
  }
}

module.exports = Department;
