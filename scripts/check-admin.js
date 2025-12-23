const db = require('../database/connection');
(async ()=>{
  try{
    const [rows] = await db.query("SELECT Id, Username, Role FROM EMPLOYEE WHERE Username = 'shahinsha' LIMIT 1");
    console.log('EMPLOYEE row for shahinsha:');
    console.log(JSON.stringify(rows, null, 2));

    const [reports] = await db.query('SELECT COUNT(*) AS cnt FROM EMPLOYEE_REPORT');
    console.log('EMPLOYEE_REPORT count:', reports[0] && reports[0].cnt);
    process.exit(0);
  }catch(e){
    console.error('DB error', e && e.message ? e.message : e);
    process.exit(1);
  }
})();