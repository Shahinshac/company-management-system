require('dotenv').config();
const Employee = require('../models/Employee');
const bcrypt = require('bcryptjs');

(async () => {
  try {
    const username = process.argv[2] || 'popi';
    const newPassword = process.argv[3] || 'popi';

    console.log('Setting password for user:', username);

    const employee = await Employee.findByIdentifier(username);
    if (!employee) {
      console.error('User not found:', username);
      process.exit(2);
    }

    const hash = await bcrypt.hash(newPassword, 12);
    const ok = await Employee.updatePassword(employee.Id, hash);
    if (!ok) {
      console.error('Failed to update password for user id', employee.Id);
      process.exit(3);
    }

    // clear force password change flag
    await Employee.setForcePasswordChange(employee.Id, 0);

    console.log('Password updated successfully for', username);
    process.exit(0);
  } catch (err) {
    console.error('Error setting password:', err && err.stack ? err.stack : err);
    process.exit(1);
  }
})();
