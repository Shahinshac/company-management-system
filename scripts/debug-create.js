const Employee = require('../models/Employee');
(async () => {
  try {
    const bcrypt = require('bcryptjs');
    const passwordHash = await bcrypt.hash('debugpw', 12);
    const id = await Employee.createAuthEmployee({ Username: 'dbgtest' + Math.floor(Math.random() * 10000), Email: 'dbgtest@example.com', passwordHash });
    console.log('Created employee id:', id);
  } catch (err) {
    console.error('Debug create error:', err);
  }
})();
