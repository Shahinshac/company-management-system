const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        error: 'Username and password are required'
      });
    }

    const user = await User.verifyPassword(username, password);
    
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid username or password'
      });
    }

    if (user.status !== 'Active') {
      return res.status(403).json({
        success: false,
        error: 'Account is inactive'
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, error: 'Login failed' });
  }
});

// Register (Admin only in production)
router.post('/register', async (req, res) => {
  try {
    const { username, password, email, role } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        error: 'Username and password are required'
      });
    }

    // Check if username exists
    if (await User.usernameExists(username)) {
      return res.status(400).json({
        success: false,
        error: 'Username already exists'
      });
    }

    // Check if email exists
    if (email && await User.emailExists(email)) {
      return res.status(400).json({
        success: false,
        error: 'Email already exists'
      });
    }

    const userId = await User.create({
      username,
      password,
      email,
      role: role || 'User'
    });

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: { id: userId, username, email, role: role || 'User' }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ success: false, error: 'Registration failed' });
  }
});

// Change password
router.post('/change-password', async (req, res) => {
  try {
    const { username, currentPassword, newPassword } = req.body;

    if (!username || !currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        error: 'All fields are required'
      });
    }

    // Verify current password
    const user = await User.verifyPassword(username, currentPassword);
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Current password is incorrect'
      });
    }

    // Update password
    await User.updatePassword(user.id, newPassword);

    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ success: false, error: 'Failed to change password' });
  }
});

module.exports = router;
