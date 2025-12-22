const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { body, validationResult } = require('express-validator');

// Register new user
router.post('/register', [
  body('username').trim().isLength({ min: 3 }).withMessage('Username must be at least 3 characters'),
  body('email').isEmail().withMessage('Valid email required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { username, email, password } = req.body;

    // Check if email already exists
    if (await User.emailExists(email)) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Check if username already exists
    if (await User.usernameExists(username)) {
      return res.status(400).json({ error: 'Username already taken' });
    }

    // Create user
    const userId = await User.create({ username, email, password });

    res.status(201).json({
      message: 'Registration successful! Waiting for admin approval.',
      userId
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
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

    // Find user
    const user = await User.findByCredentials(identifier);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check if user is approved
    if (user.Status === 'Pending') {
      return res.status(403).json({ error: 'Account pending admin approval' });
    }

    if (user.Status === 'Rejected') {
      return res.status(403).json({ error: 'Account has been rejected' });
    }

    // Verify password
    const isValidPassword = await User.verifyPassword(password, user.Password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate token
    const token = User.generateToken(user);

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.Id,
        username: user.Username,
        email: user.Email,
        role: user.Role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Get current user profile
router.get('/me', async (req, res) => {
  try {
    // This route needs authentication middleware
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'Token required' });
    }

    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to get user info' });
  }
});

module.exports = router;
