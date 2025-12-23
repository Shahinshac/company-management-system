const db = require('../database/connection');
(async ()=>{
  try{
    console.log('Checking current FK...');
    const [fks] = await db.query("SELECT CONSTRAINT_NAME, REFERENCED_TABLE_NAME FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'DEPENDENT' AND REFERENCED_TABLE_NAME IS NOT NULL");
    console.log('FKs:', fks);

    const fk = fks.find(f => f.REFERENCED_TABLE_NAME && f.REFERENCED_TABLE_NAME.toUpperCase().includes('EMPLOYEE'));
    if (!fk) {
      console.log('No FK to EMPLOYEE* found; nothing to do.');
      process.exit(0);
    }

    console.log(`Dropping foreign key ${fk.CONSTRAINT_NAME} (references ${fk.REFERENCED_TABLE_NAME})`);
    await db.query(`ALTER TABLE DEPENDENT DROP FOREIGN KEY \`${fk.CONSTRAINT_NAME}\``);
    console.log('Dropped FK. Adding new FK to EMPLOYEE(Id)');

    await db.query('ALTER TABLE DEPENDENT ADD CONSTRAINT DEPENDENT_ibfk_1 FOREIGN KEY (Employee_Id) REFERENCES EMPLOYEE(Id) ON DELETE CASCADE');
    console.log('Added FK to EMPLOYEE table successfully');

    console.log('Verifying...');
    const [newFks] = await db.query("SELECT CONSTRAINT_NAME, REFERENCED_TABLE_NAME FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'DEPENDENT' AND REFERENCED_TABLE_NAME IS NOT NULL");
    console.log('New FK list:', newFks);

    process.exit(0);
  }catch(e){ console.error('ERR', e && e.stack ? e.stack : e); process.exit(1);} 
})();