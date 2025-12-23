const express = require('express');
const router = express.Router();
const Employee = require('../models/Employee');
const { authenticateToken, requireAdmin } = require('../middleware/authMiddleware');

// All routes require authentication
router.use(authenticateToken);

// Get all employees (admin only)
router.get('/', requireAdmin, async (req, res) => {
  try {
    const branch = req.query.branch || null;
    const users = await Employee.getAllUsers(branch);
    res.json(users);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Create new employee (admin only)
router.post('/', requireAdmin, async (req, res) => {
  try {
    const { username, email, role = 'Employee', Name, Branch = null } = req.body;
    console.log('Create user request body:', { username, email, role });

    if (!username || !email) {
      return res.status(400).json({ error: 'Username and email are required' });
    }

    // Basic username/email validation
    if (username.length < 3 || username.length > 50) {
      return res.status(400).json({ error: 'Username must be between 3 and 50 characters' });
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email address' });
    }

    // Prevent duplicates
    if (await Employee.usernameExists(username)) {
      return res.status(409).json({ error: 'Username already exists' });
    }
    if (await Employee.emailExists(email)) {
      return res.status(409).json({ error: 'Email already exists' });
    }

    // Generate password connected to username: prefix of username + random suffix
    const crypto = require('crypto');
    const rand = crypto.randomBytes(9).toString('base64').replace(/[^a-zA-Z0-9]/g, '').slice(0,8);
    const prefix = username.slice(0,4).replace(/[^a-zA-Z0-9]/g, '') || 'usr';
    const rawPassword = `${prefix}-${rand}`;

    // Hash the password
    const bcrypt = require('bcryptjs');
    const passwordHash = await bcrypt.hash(rawPassword, 12);

    // Create employee record; allow Name override and Branch
    const userId = await Employee.createAuthEmployee({ Username: username, Email: email, Role: role, passwordHash, Name, Branch });

    // Audit log
    const AuditLog = require('../models/AuditLog');
    await AuditLog.record({ employeeId: userId, action: 'create', changedBy: req.user.id, changes: { username, email, role, Branch } });

    // Return the generated password ONCE
    res.status(201).json({ message: 'Employee created', userId, generatedPassword: rawPassword });
  } catch (error) {
    console.error('Create employee error:', error);
    res.status(500).json({ error: 'Failed to create employee' });
  }
});

// Update user role (admin only)
router.patch('/:id/role', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;
    
    if (!['Admin', 'Employee'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }
    
    const success = await Employee.updateRole(id, role);
    
    if (!success) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({ message: 'User role updated successfully' });
  } catch (error) {
    console.error('Update role error:', error);
    res.status(500).json({ error: 'Failed to update user role' });
  }
});

// Admin: Reset user password (returns new password once)
router.post('/:id/reset-password', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const crypto = require('crypto');
    // match create behavior: username-based prefix + random suffix
    const user = await Employee.getById(id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    const username = user.Username || `user${id}`;
    const rand = crypto.randomBytes(9).toString('base64').replace(/[^a-zA-Z0-9]/g, '').slice(0,8);
    const prefix = username.slice(0,4).replace(/[^a-zA-Z0-9]/g, '') || 'usr';
    const rawPassword = `${prefix}-${rand}`;
    const bcrypt = require('bcryptjs');
    const passwordHash = await bcrypt.hash(rawPassword, 12);

    const success = await Employee.updatePassword(id, passwordHash);
    if (!success) return res.status(404).json({ error: 'User not found' });

    await Employee.setForcePasswordChange(id, 1);

    // Audit reset
    const AuditLog = require('../models/AuditLog');
    await AuditLog.record({ employeeId: id, action: 'reset_password', changedBy: req.user.id, changes: { method: 'admin_reset' } });

    // Return password once
    res.json({ message: 'Password reset successfully', generatedPassword: rawPassword });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Failed to reset password' });
  }
});

// Delete user (admin only)
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Prevent admin from deleting themselves
    if (parseInt(id) === req.user.id) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }
    
    const success = await Employee.deleteEmployee(id);
    
    if (!success) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Audit delete
    const AuditLog = require('../models/AuditLog');
    await AuditLog.record({ employeeId: id, action: 'delete', changedBy: req.user.id, changes: null });

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// Update full employee details (admin only)
router.put('/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const updated = req.body; // Expect fields matching Employee.update signature

    const affected = await Employee.update(id, updated);
    if (!affected) return res.status(404).json({ error: 'User not found' });

    // Audit
    const AuditLog = require('../models/AuditLog');
    await AuditLog.record({ employeeId: id, action: 'update', changedBy: req.user.id, changes: updated });

    res.json({ message: 'User updated successfully' });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// Get audit log for an employee (admin only)
router.get('/:id/audit', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const AuditLog = require('../models/AuditLog');
    const logs = await AuditLog.getByEmployee(id);
    res.json({ audits: logs });
  } catch (error) {
    console.error('Get audit error:', error);
    res.status(500).json({ error: 'Failed to fetch audit logs' });
  }
});

// Admin: verify a provided password for an employee (does not reveal stored password)
router.post('/:id/check-password', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { password } = req.body;
    if (!password) return res.status(400).json({ error: 'Password is required' });

    const employee = await Employee.getById(id);
    if (!employee) return res.status(404).json({ error: 'User not found' });

    const match = await Employee.verifyPassword(password, employee.Password);

    // Audit the check action (without storing the provided password)
    const AuditLog = require('../models/AuditLog');
    await AuditLog.record({ employeeId: id, action: 'password_check', changedBy: req.user.id, changes: { match } });

    res.json({ match });
  } catch (error) {
    console.error('Check password error:', error);
    res.status(500).json({ error: 'Failed to check password' });
  }
});

module.exports = router;

