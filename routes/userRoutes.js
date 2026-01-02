const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { authenticateToken, isAdmin } = require('../middleware/authMiddleware');

// Get all users (Admin only)
router.get('/', authenticateToken, isAdmin, async (req, res) => {
  try {
    const users = await User.getAll();
    res.json({
      success: true,
      count: users.length,
      data: users
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get user by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    // Users can only view their own profile unless admin
    if (req.user.role !== 'Admin' && req.user.id !== parseInt(req.params.id)) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    const user = await User.getById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create user (Admin only)
router.post('/', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { username, password, email, role, emp_id } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        error: 'Username and password are required'
      });
    }

    if (await User.usernameExists(username)) {
      return res.status(400).json({
        success: false,
        error: 'Username already exists'
      });
    }

    if (email && await User.emailExists(email)) {
      return res.status(400).json({
        success: false,
        error: 'Email already exists'
      });
    }

    const userId = await User.create({ username, password, email, role, emp_id });
    const user = await User.getById(userId);

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: user
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update user
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    // Users can only update their own profile unless admin
    if (req.user.role !== 'Admin' && req.user.id !== parseInt(req.params.id)) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    const { username, email, role, status, emp_id } = req.body;

    // Non-admin users cannot change their role or status
    const updateData = { username, email, emp_id };
    if (req.user.role === 'Admin') {
      updateData.role = role;
      updateData.status = status;
    }

    if (await User.usernameExists(username, req.params.id)) {
      return res.status(400).json({
        success: false,
        error: 'Username already exists'
      });
    }

    if (email && await User.emailExists(email, req.params.id)) {
      return res.status(400).json({
        success: false,
        error: 'Email already exists'
      });
    }

    const affectedRows = await User.update(req.params.id, updateData);
    if (affectedRows === 0) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    const user = await User.getById(req.params.id);
    res.json({
      success: true,
      message: 'User updated successfully',
      data: user
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Delete user (Admin only)
router.delete('/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    // Prevent deleting own account
    if (req.user.id === parseInt(req.params.id)) {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete your own account'
      });
    }

    const affectedRows = await User.delete(req.params.id);
    if (affectedRows === 0) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;

