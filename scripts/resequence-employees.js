const db = require('../database/connection');

(async () => {
  try {
    console.log('Starting resequence process (local DB)');

    // 1) Backups
    console.log('Creating backups...');
    // Use LIKE to preserve primary keys and indexes, then copy rows
    await db.query('DROP TABLE IF EXISTS EMPLOYEE_backup');
    await db.query('CREATE TABLE EMPLOYEE_backup LIKE EMPLOYEE');
    await db.query('INSERT INTO EMPLOYEE_backup SELECT * FROM EMPLOYEE');

    await db.query('DROP TABLE IF EXISTS WORKS_ON_backup');
    await db.query('CREATE TABLE WORKS_ON_backup LIKE WORKS_ON');
    await db.query('INSERT INTO WORKS_ON_backup SELECT * FROM WORKS_ON');

    await db.query('DROP TABLE IF EXISTS DEPENDENT_backup');
    await db.query('CREATE TABLE DEPENDENT_backup LIKE DEPENDENT');
    await db.query('INSERT INTO DEPENDENT_backup SELECT * FROM DEPENDENT');
    console.log('Backups created: EMPLOYEE_backup, WORKS_ON_backup, DEPENDENT_backup');

    // 2) Remove project assignments for Admin users
    console.log('Removing project assignments for Admin users...');
    await db.query("DELETE w FROM WORKS_ON w JOIN EMPLOYEE e ON w.Employee_Id = e.Id WHERE e.Role = 'Admin'");
    console.log('Deleted admin project assignments (if any)');

    // 3) Create EMPLOYEE_new with same structure and populate in desired order
    console.log('Creating EMPLOYEE_new and copying rows in ordered sequence...');
    await db.query('DROP TABLE IF EXISTS EMPLOYEE_new');
    await db.query('CREATE TABLE EMPLOYEE_new LIKE EMPLOYEE');
    // Copy all columns except Id, letting auto_increment assign new Ids
    // Build column list dynamically excluding Id
    const [cols] = await db.query("SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME='EMPLOYEE' ORDER BY ORDINAL_POSITION");
    const colNames = cols.map(c => c.COLUMN_NAME).filter(n => n.toLowerCase() !== 'id');
    const colList = colNames.map(n => `\`${n}\``).join(',');
    // Use created_at then Id for ordering
    const insertSql = `INSERT INTO EMPLOYEE_new (${colList}) SELECT ${colList} FROM EMPLOYEE ORDER BY COALESCE(created_at,'1970-01-01'), Id`;
    await db.query(insertSql);
    console.log('EMPLOYEE_new populated');

    // 4) Build mapping old->new using sequence tables
    console.log('Building mapping of old to new IDs...');
    await db.query('DROP TEMPORARY TABLE IF EXISTS old_order');
    await db.query('CREATE TEMPORARY TABLE old_order (seq INT AUTO_INCREMENT PRIMARY KEY, oldId INT)');
    await db.query("INSERT INTO old_order (oldId) SELECT Id FROM EMPLOYEE ORDER BY COALESCE(created_at,'1970-01-01'), Id");

    await db.query('DROP TEMPORARY TABLE IF EXISTS new_order');
    await db.query('CREATE TEMPORARY TABLE new_order (seq INT AUTO_INCREMENT PRIMARY KEY, newId INT)');
    await db.query("INSERT INTO new_order (newId) SELECT Id FROM EMPLOYEE_new ORDER BY COALESCE(created_at,'1970-01-01'), Id");

    // 5) Update WORKS_ON and DEPENDENT to remap employee ids
    console.log('Updating WORKS_ON to use new employee IDs...');
    await db.query(`UPDATE WORKS_ON w JOIN old_order o ON w.Employee_Id = o.oldId JOIN new_order n ON o.seq = n.seq SET w.Employee_Id = n.newId`);
    console.log('Updating DEPENDENT to use new employee IDs...');
    await db.query(`UPDATE DEPENDENT d JOIN old_order o ON d.Employee_Id = o.oldId JOIN new_order n ON o.seq = n.seq SET d.Employee_Id = n.newId`);

    // 6) Swap tables (rename)
    console.log('Renaming tables (EMPLOYEE -> EMPLOYEE_old, EMPLOYEE_new -> EMPLOYEE)');
    await db.query('RENAME TABLE EMPLOYEE TO EMPLOYEE_old, EMPLOYEE_new TO EMPLOYEE');

    // 7) Set new auto_increment value
    const [maxRows] = await db.query('SELECT MAX(Id) as maxId FROM EMPLOYEE');
    const maxId = maxRows && maxRows[0] && maxRows[0].maxId ? maxRows[0].maxId : 0;
    if (maxId) {
      await db.query(`ALTER TABLE EMPLOYEE AUTO_INCREMENT = ${maxId + 1}`);
    }

    // 8) Small verification counts
    const [c1] = await db.query('SELECT COUNT(*) AS cnt FROM EMPLOYEE');
    const [c2] = await db.query('SELECT COUNT(*) AS cnt FROM EMPLOYEE_old');
    const [c3] = await db.query('SELECT COUNT(*) AS cnt FROM WORKS_ON');
    console.log('Counts: EMPLOYEE new=', c1[0].cnt, 'EMPLOYEE_old=', c2[0].cnt, 'WORKS_ON=', c3[0].cnt);

    // 9) Record audit log entry
    try {
      await db.query("INSERT INTO AUDIT_LOG (Employee_Id, Action, Changed_By, Changes) VALUES (NULL,'resequence_employee_ids',NULL, 'Removed admin project assignments and resequenced IDs')");
    } catch (e) {
      console.warn('Unable to insert audit log (table may not exist):', e.message);
    }

    console.log('Resequence process complete. Keep backups EMPLOYEE_backup, WORKS_ON_backup, DEPENDENT_backup and EMPLOYEE_old until verification is complete.');
    process.exit(0);
  } catch (err) {
    console.error('Error during resequence:', err && err.stack ? err.stack : err);
    process.exit(1);
  }
})();