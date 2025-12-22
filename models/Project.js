const db = require('../database/connection');

class Project {
  // Get all projects
  static async getAll() {
    const [rows] = await db.query(`
      SELECT p.*, d.Name as Department_Name,
             (SELECT COUNT(*) FROM WORKS_ON WHERE Project_No = p.P_No) as Employee_Count
      FROM PROJECT p
      LEFT JOIN DEPARTMENT d ON p.Department_No = d.D_No
      ORDER BY p.Name
    `);
    return rows;
  }

  // Get project by ID
  static async getById(pNo) {
    const [rows] = await db.query(`
      SELECT p.*, d.Name as Department_Name, d.Location as Department_Location,
             (SELECT COUNT(*) FROM WORKS_ON WHERE Project_No = p.P_No) as Employee_Count
      FROM PROJECT p
      LEFT JOIN DEPARTMENT d ON p.Department_No = d.D_No
      WHERE p.P_No = ?
    `, [pNo]);
    return rows[0];
  }

  // Create new project
  static async create(projectData) {
    const { P_No, Name, Location, Department_No, Budget, Start_Date, End_Date, Status } = projectData;
    const [result] = await db.query(`
      INSERT INTO PROJECT (P_No, Name, Location, Department_No, Budget, Start_Date, End_Date, Status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [P_No, Name, Location, Department_No, Budget, Start_Date, End_Date, Status || 'Planning']);
    return P_No;
  }

  // Update project
  static async update(pNo, projectData) {
    const { Name, Location, Department_No, Budget, Start_Date, End_Date, Status } = projectData;
    const [result] = await db.query(`
      UPDATE PROJECT 
      SET Name = ?, Location = ?, Department_No = ?, Budget = ?, 
          Start_Date = ?, End_Date = ?, Status = ?
      WHERE P_No = ?
    `, [Name, Location, Department_No, Budget, Start_Date, End_Date, Status, pNo]);
    return result.affectedRows;
  }

  // Delete project
  static async delete(pNo) {
    const [result] = await db.query('DELETE FROM PROJECT WHERE P_No = ?', [pNo]);
    return result.affectedRows;
  }

  // Get project employees
  static async getEmployees(pNo) {
    const [rows] = await db.query(`
      SELECT e.*, w.Hours, w.Assignment_Date, w.Role
      FROM EMPLOYEE e
      INNER JOIN WORKS_ON w ON e.Id = w.Employee_Id
      WHERE w.Project_No = ?
      ORDER BY e.Name
    `, [pNo]);
    return rows;
  }

  // Get projects by status
  static async getByStatus(status) {
    const [rows] = await db.query(`
      SELECT p.*, d.Name as Department_Name,
             (SELECT COUNT(*) FROM WORKS_ON WHERE Project_No = p.P_No) as Employee_Count
      FROM PROJECT p
      LEFT JOIN DEPARTMENT d ON p.Department_No = d.D_No
      WHERE p.Status = ?
      ORDER BY p.Start_Date DESC
    `, [status]);
    return rows;
  }

  // Get project statistics
  static async getStatistics(pNo) {
    const [stats] = await db.query(`
      SELECT 
        p.P_No,
        p.Name,
        p.Budget,
        COUNT(DISTINCT w.Employee_Id) as Total_Employees,
        SUM(w.Hours) as Total_Hours,
        AVG(w.Hours) as Average_Hours_Per_Employee
      FROM PROJECT p
      LEFT JOIN WORKS_ON w ON p.P_No = w.Project_No
      WHERE p.P_No = ?
      GROUP BY p.P_No, p.Name, p.Budget
    `, [pNo]);
    return stats[0];
  }

  // Update project status
  static async updateStatus(pNo, status) {
    const [result] = await db.query(`
      UPDATE PROJECT SET Status = ? WHERE P_No = ?
    `, [status, pNo]);
    return result.affectedRows;
  }
}

module.exports = Project;
