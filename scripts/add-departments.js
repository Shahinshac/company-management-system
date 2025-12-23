const db = require('../database/connection');

(async ()=>{
  try{
    const desired = [
      { D_No: 'D006', Name: 'Product', Location: 'Headquarters' },
      { D_No: 'D007', Name: 'DevOps', Location: 'Tech Park' }
    ];

    for (const dep of desired) {
      // check by D_No or Name
      const [rows] = await db.query('SELECT * FROM DEPARTMENT WHERE D_No = ? OR Name = ? LIMIT 1', [dep.D_No, dep.Name]);
      if (rows && rows.length > 0) {
        console.log('Skipping existing department:', dep.Name);
        continue;
      }
      await db.query('INSERT INTO DEPARTMENT (D_No, Name, Location) VALUES (?, ?, ?)', [dep.D_No, dep.Name, dep.Location]);
      console.log('Inserted department:', dep.Name);
    }

    const [all] = await db.query('SELECT D_No, Name, Location FROM DEPARTMENT ORDER BY D_No');
    console.log('Departments now:', all.length);
    console.log(JSON.stringify(all, null, 2));
    process.exit(0);
  }catch(err){
    console.error('Error adding departments:', err && err.message?err.message:err);
    process.exit(1);
  }
})();
