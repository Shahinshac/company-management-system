const db = require('../database/connection');

class Report {
  static async ensureTable() {
    await db.query(`
      CREATE TABLE IF NOT EXISTS EMPLOYEE_REPORT (
        Id INT AUTO_INCREMENT PRIMARY KEY,
        Employee_Id INT NOT NULL,
        Employee_Username VARCHAR(255),
        Employee_Name VARCHAR(255),
        Department JSON NULL,
        Projects JSON NULL,
        Dependents JSON NULL,
        Audits JSON NULL,
        Created_At TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX (Employee_Id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
  }

  static async rebuildAll() {
    await this.ensureTable();
    // Truncate existing
    await db.query('TRUNCATE TABLE EMPLOYEE_REPORT');
    // Build aggregated rows
    const [employees] = await db.query('SELECT Id, Username, Name, Department_No FROM EMPLOYEE');

    for (const e of employees) {
      // Department
      const [depRows] = await db.query('SELECT D_No, Name, Location FROM DEPARTMENT WHERE D_No = ?', [e.Department_No]);
      const department = depRows[0] || null;

      // Projects
      const [projRows] = await db.query(
        `SELECT p.P_No, p.Name, w.Hours, w.Role FROM WORKS_ON w JOIN PROJECT p ON w.Project_No = p.P_No WHERE w.Employee_Id = ?`,
        [e.Id]
      );

      // Dependents
      const [depentRows] = await db.query('SELECT Id, D_name, Gender, Relationship, Date_of_Birth FROM DEPENDENT WHERE Employee_Id = ?', [e.Id]);

      // Audit logs (last 20)
      let audits = [];
      try {
        const [auditRows] = await db.query('SELECT Id, Action, Changed_By, Changes, Created_At FROM AUDIT_LOG WHERE Employee_Id = ? ORDER BY Created_At DESC LIMIT 20', [e.Id]);
        audits = auditRows.map(a => ({ Id: a.Id, Action: a.Action, Changed_By: a.Changed_By, Changes: a.Changes ? JSON.parse(a.Changes) : null, Created_At: a.Created_At }));
      } catch (err) {
        // ignore if table missing
      }

      await db.query(
        'INSERT INTO EMPLOYEE_REPORT (Employee_Id, Employee_Username, Employee_Name, Department, Projects, Dependents, Audits) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [e.Id, e.Username, e.Name, department ? JSON.stringify(department) : null, JSON.stringify(projRows || []), JSON.stringify(depentRows || []), JSON.stringify(audits || [])]
      );
    }
    return true;
  }

  static async getAll() {
    await this.ensureTable();
    const [rows] = await db.query('SELECT * FROM EMPLOYEE_REPORT ORDER BY Created_At DESC');
    return rows.map(r => ({ ...r, Department: r.Department ? JSON.parse(r.Department) : null, Projects: r.Projects ? JSON.parse(r.Projects) : [], Dependents: r.Dependents ? JSON.parse(r.Dependents) : [], Audits: r.Audits ? JSON.parse(r.Audits) : [] }));
  }

  static async getByEmployee(employeeId) {
    await this.ensureTable();
    const [rows] = await db.query('SELECT * FROM EMPLOYEE_REPORT WHERE Employee_Id = ? ORDER BY Created_At DESC', [employeeId]);
    return rows.map(r => ({ ...r, Department: r.Department ? JSON.parse(r.Department) : null, Projects: r.Projects ? JSON.parse(r.Projects) : [], Dependents: r.Dependents ? JSON.parse(r.Dependents) : [], Audits: r.Audits ? JSON.parse(r.Audits) : [] }));
  }
}

module.exports = Report;
