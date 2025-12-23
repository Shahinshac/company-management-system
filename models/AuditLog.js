const db = require('../database/connection');

class AuditLog {
  // Ensure table exists and then insert a record
  static async ensureTable() {
    await db.query(`
      CREATE TABLE IF NOT EXISTS AUDIT_LOG (
        Id INT AUTO_INCREMENT PRIMARY KEY,
        Employee_Id INT NOT NULL,
        Action VARCHAR(100) NOT NULL,
        Changed_By INT NULL,
        Changes JSON NULL,
        Created_At TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX (Employee_Id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
  }

  static async record({ employeeId, action, changedBy = null, changes = null }) {
    await this.ensureTable();
    const [result] = await db.query(
      'INSERT INTO AUDIT_LOG (Employee_Id, Action, Changed_By, Changes) VALUES (?, ?, ?, ?)',
      [employeeId, action, changedBy, changes ? JSON.stringify(changes) : null]
    );
    return result.insertId;
  }

  static async getByEmployee(employeeId, limit = 100) {
    await this.ensureTable();
    const [rows] = await db.query('SELECT Id, Employee_Id, Action, Changed_By, Changes, Created_At FROM AUDIT_LOG WHERE Employee_Id = ? ORDER BY Created_At DESC LIMIT ?', [employeeId, limit]);
    // parse JSON changes
    return rows.map(r => ({ ...r, Changes: r.Changes ? JSON.parse(r.Changes) : null }));
  }
}

module.exports = AuditLog;
