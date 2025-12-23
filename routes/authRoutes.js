const express = require('express');
const router = express.Router();
const Employee = require('../models/Employee');
const { body, validationResult } = require('express-validator');

// NOTE: Public registration is disabled. All users must be created by Admin.
router.post('/register', (req, res) => {
  return res.status(403).json({ error: 'Self registration is disabled. Contact an administrator.' });
});

// Login
router.post('/login', [
  body('identifier').notEmpty().withMessage('Username or email required'),
  body('password').notEmpty().withMessage('Password required'),
], async (req, res) => {
  try {
    const devLog = (msg, obj) => {
      if (process.env.DEBUG_AUTH === 'true' || process.env.NODE_ENV !== 'production') {
        if (obj) console.log(msg, obj);
        else console.log(msg);
      }
    };

    devLog('Login request headers:', req.headers);
    devLog('Login request body snippet:', JSON.stringify(req.body).slice(0, 200));

    // Check DB connectivity early and return 503 if unavailable
    try {
      const db = require('../database/connection');
      await db.query('SELECT 1');
    } catch (dbErr) {
      console.error('Database unavailable during login:', dbErr && dbErr.stack ? dbErr.stack : dbErr);
      return res.status(503).json({ error: 'Service unavailable - database connection failed' });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const payload = { errors: errors.array() };
      devLog('Responding 400:', payload);
      return res.status(400).json(payload);
    }

    const { identifier, password } = req.body;

    // Find employee by username or email
    devLog('Login attempt for identifier:', identifier);
    const employee = await Employee.findByIdentifier(identifier);
    devLog('Employee found:', employee ? { id: employee.Id, username: employee.Username, email: employee.Email, status: employee.Status } : null);
    if (!employee) {
      const payload = { error: 'Invalid credentials' };
      devLog('Responding 401:', payload);
      return res.status(401).json(payload);
    }

    // Check status
    if (employee.Status !== 'Active') {
      const payload = { error: 'Account is inactive. Contact admin.' };
      devLog('Responding 403:', payload);
      return res.status(403).json(payload);
    }

    // Verify password
    const isValidPassword = await Employee.verifyPassword(password, employee.Password);
    devLog('Password verification result for user', { username: employee.Username, ok: isValidPassword });
    if (!isValidPassword) {
      const payload = { error: 'Invalid credentials' };
      devLog('Responding 401:', payload);
      return res.status(401).json(payload);
    }

    // Generate token
    const token = Employee.generateToken(employee);

    const payload = {
      message: 'Login successful',
      token,
      user: {
        id: employee.Id,
        username: employee.Username,
        email: employee.Email,
        role: employee.Role,
        forcePasswordChange: !!employee.ForcePasswordChange
      }
    };
    devLog('Responding 200:', { message: payload.message, user: payload.user });
    res.json(payload);
  } catch (error) {
    console.error('Login error:', error && error.stack ? error.stack : error);
    // Provide a safe error message and include details only in non-production
    const resp = { error: 'Internal server error' };
    if (process.env.NODE_ENV !== 'production') resp.details = error && (error.message || error.stack);
    res.status(500).json(resp);
  }
});

const { authenticateToken } = require('../middleware/authMiddleware');

// Get current employee profile
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const employee = await Employee.getById(req.user.id);
    if (!employee) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ user: employee });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to get user info' });
  }
});

// Change password (user)
router.patch('/change-password', authenticateToken, async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters' });
    }

    const employee = await Employee.findByIdentifier(req.user.username || req.user.email);
    if (!employee) return res.status(404).json({ error: 'User not found' });

    // If oldPassword provided, verify it
    if (oldPassword) {
      const isValid = await Employee.verifyPassword(oldPassword, employee.Password);
      if (!isValid) return res.status(401).json({ error: 'Old password incorrect' });
    }

    const bcrypt = require('bcryptjs');
    const hash = await bcrypt.hash(newPassword, 12);
    await Employee.updatePassword(employee.Id, hash);

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ error: 'Failed to change password' });
  }
});

module.exports = router;
