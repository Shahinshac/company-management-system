const db = require('../database/connection');

(async ()=>{
  try{
    const [rows] = await db.query('SELECT Id,Username FROM EMPLOYEE WHERE Username = ?', ['admin']);
    if (!rows || rows.length === 0) {
      console.log('No admin account found');
      process.exit(0);
    }
    const id = rows[0].Id;
    await db.query('DELETE FROM EMPLOYEE WHERE Id = ?', [id]);
    console.log('Deleted admin user with id', id);
    process.exit(0);
  }catch(err){
    console.error('Error deleting admin:', err && err.message?err.message:err);
    process.exit(1);
  }
})();
