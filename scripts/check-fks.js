const db = require('../database/connection');
(async ()=>{
  try{
    const [tables] = await db.query("SHOW TABLES LIKE 'EMPLOYEE_old'");
    console.log('EMPLOYEE_old exists:', tables.length > 0);
    if (tables.length > 0) {
      const [cntOld] = await db.query('SELECT COUNT(*) AS cnt FROM EMPLOYEE_old');
      console.log('EMPLOYEE_old count:', cntOld[0].cnt);
    }
    const [cntEmp] = await db.query('SELECT COUNT(*) AS cnt FROM EMPLOYEE');
    console.log('EMPLOYEE count:', cntEmp[0].cnt);

    const [cntDep] = await db.query('SELECT COUNT(*) AS cnt FROM DEPENDENT');
    console.log('DEPENDENT count:', cntDep[0].cnt);

    const [orphanDeps] = await db.query("SELECT COUNT(*) AS cnt FROM DEPENDENT d LEFT JOIN EMPLOYEE e ON d.Employee_Id = e.Id WHERE e.Id IS NULL");
    console.log('Dependents without employee in EMPLOYEE:', orphanDeps[0].cnt);

    const [fkInfo] = await db.query("SELECT CONSTRAINT_NAME, REFERENCED_TABLE_NAME FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'DEPENDENT' AND REFERENCED_TABLE_NAME IS NOT NULL");
    console.log('DEPENDENT foreign keys:', fkInfo);

    process.exit(0);
  }catch(e){ console.error('ERR', e && e.stack ? e.stack : e); process.exit(1);} 
})();