const express = require('express');
const router = express.Router();
const Employee = require('../models/Employee');
const { authenticateToken, requireAdmin } = require('../middleware/authMiddleware');

// All routes require authentication
router.use(authenticateToken);

// Get all employees (admin only)
router.get('/', requireAdmin, async (req, res) => {
  try {
    const users = await Employee.getAllUsers();
    res.json(users);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Create new employee (admin only)
router.post('/', requireAdmin, async (req, res) => {
  try {
    const { username, email, role = 'Employee' } = req.body;

    if (!username || !email) {
      return res.status(400).json({ error: 'Username and email are required' });
    }

    // Prevent duplicates
    if (await Employee.usernameExists(username)) {
      return res.status(400).json({ error: 'Username already exists' });
    }
    if (await Employee.emailExists(email)) {
      return res.status(400).json({ error: 'Email already exists' });
    }

    // Generate secure random password (12 chars)
    const crypto = require('crypto');
    const rawPassword = crypto.randomBytes(9).toString('base64').slice(0,12);

    // Hash the password
    const bcrypt = require('bcryptjs');
    const passwordHash = await bcrypt.hash(rawPassword, 12);

    // Create employee record
    const userId = await Employee.createAuthEmployee({ Username: username, Email: email, Role: role, passwordHash });

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
    const rawPassword = crypto.randomBytes(9).toString('base64').slice(0,12);
    const bcrypt = require('bcryptjs');
    const passwordHash = await bcrypt.hash(rawPassword, 12);

    const success = await Employee.updatePassword(id, passwordHash);
    if (!success) return res.status(404).json({ error: 'User not found' });

    await Employee.setForcePasswordChange(id, 1);

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
    
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// Update user role (admin only)
router.patch('/:id/role', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;
    
    if (!['Admin', 'Manager', 'Employee'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }
    
    const success = await User.updateRole(id, role);
    
    if (!success) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({ message: 'User role updated successfully' });
  } catch (error) {
    console.error('Update role error:', error);
    res.status(500).json({ error: 'Failed to update user role' });
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
    
    const success = await User.delete(id);
    
    if (!success) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

module.exports = router;
