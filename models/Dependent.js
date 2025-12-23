const db = require('../database/connection');

class Dependent {
  // Get all dependents
  static async getAll() {
    const [rows] = await db.query(`
      SELECT d.*, e.Name as Employee_Name
      FROM DEPENDENT d
      INNER JOIN EMPLOYEE e ON d.Employee_Id = e.Id
      ORDER BY e.Name, d.D_name
    `);
    return rows;
  }

  // Get dependent by ID
  static async getById(id) {
    const [rows] = await db.query(`
      SELECT d.*, e.Name as Employee_Name, e.Email as Employee_Email
      FROM DEPENDENT d
      INNER JOIN EMPLOYEE e ON d.Employee_Id = e.Id
      WHERE d.Id = ?
    `, [id]);
    return rows[0];
  }

  // Create new dependent
  static async create(dependentData) {
    const { Employee_Id, D_name, Gender, Relationship, Date_of_Birth } = dependentData;
    const [result] = await db.query(`
      INSERT INTO DEPENDENT (Employee_Id, D_name, Gender, Relationship, Date_of_Birth)
      VALUES (?, ?, ?, ?, ?)
    `, [Employee_Id, D_name, Gender, Relationship, Date_of_Birth]);
    return result.insertId;
  }

  // Update dependent
  static async update(id, dependentData) {
    const { D_name, Gender, Relationship, Date_of_Birth } = dependentData;
    const [result] = await db.query(`
      UPDATE DEPENDENT 
      SET D_name = ?, Gender = ?, Relationship = ?, Date_of_Birth = ?
      WHERE Id = ?
    `, [D_name, Gender, Relationship, Date_of_Birth, id]);
    return result.affectedRows;
  }

  // Delete dependent
  static async delete(id) {
    const [result] = await db.query('DELETE FROM DEPENDENT WHERE Id = ?', [id]);
    return result.affectedRows;
  }

  static async deleteByEmployee(employeeId) {
    const [result] = await db.query('DELETE FROM DEPENDENT WHERE Employee_Id = ?', [employeeId]);
    return result.affectedRows;
  }

  // Get dependents by employee
  static async getByEmployee(employeeId) {
    const [rows] = await db.query(`
      SELECT * FROM DEPENDENT WHERE Employee_Id = ?
      ORDER BY D_name
    `, [employeeId]);
    return rows;
  }
}

module.exports = Dependent;
