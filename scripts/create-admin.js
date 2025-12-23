require('dotenv').config();
const Employee = require('../models/Employee');
const bcrypt = require('bcryptjs');

(async () => {
  try {
    const username = process.argv[2] || 'shahinsha';
    const password = process.argv[3] || 'popi';
    const name = process.argv[4] || 'Shahinsha';

    console.log('Ensuring admin user:', username);

    const existing = await Employee.findByIdentifier(username);
    if (existing) {
      console.log('User exists, updating role/password...');
      const hash = await bcrypt.hash(password, 12);
      await Employee.updatePassword(existing.Id, hash);
      await Employee.setForcePasswordChange(existing.Id, 0);
      await Employee.updateRole(existing.Id, 'Admin');
      await Employee.setStatus(existing.Id, 'Active');
      console.log('Updated existing user to Admin:', username);
      process.exit(0);
    }

    // create new admin
    const hash = await bcrypt.hash(password, 12);
    const userId = await Employee.createAuthEmployee({ Username: username, Email: `${username}@example.com`, Role: 'Admin', passwordHash: hash, Name: name });
    // clear force password change
    await Employee.setForcePasswordChange(userId, 0);
    await Employee.setStatus(userId, 'Active');

    console.log('Created admin user', username, 'id:', userId);
    process.exit(0);
  } catch (err) {
    console.error('Error creating admin:', err && err.stack ? err.stack : err);
    process.exit(1);
  }
})();
