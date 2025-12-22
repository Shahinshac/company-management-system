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
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { identifier, password } = req.body;

    // Find employee by username or email
    const employee = await Employee.findByIdentifier(identifier);
    if (!employee) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check status
    if (employee.Status !== 'Active') {
      return res.status(403).json({ error: 'Account is inactive. Contact admin.' });
    }

    // Verify password
    const isValidPassword = await Employee.verifyPassword(password, employee.Password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate token
    const token = Employee.generateToken(employee);

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: employee.Id,
        username: employee.Username,
        email: employee.Email,
        role: employee.Role,
        forcePasswordChange: !!employee.ForcePasswordChange
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
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

module.exports = router;
