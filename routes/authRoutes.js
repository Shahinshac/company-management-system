const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const pool = require('../database/connection');
const { authenticateToken } = require('../middleware/authMiddleware');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-26-07';

// Login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ success: false, message: 'Username and password are required' });
    }

    const [users] = await pool.query('SELECT * FROM users WHERE username = ?', [username]);

    if (users.length === 0) {
      return res.status(401).json({ success: false, message: 'Invalid username or password' });
    }

    const user = users[0];

    // Check if account is locked
    if (user.locked_until && new Date(user.locked_until) > new Date()) {
      return res.status(423).json({ success: false, message: 'Account is locked. Try again later.' });
    }

    const isValid = await bcrypt.compare(password, user.password);

    if (!isValid) {
      return res.status(401).json({ success: false, message: 'Invalid username or password' });
    }

    // Check status
    if (user.status === 'Pending') {
      return res.status(403).json({ success: false, message: 'Account pending approval', status: 'pending' });
    }

    if (user.status !== 'Active') {
      return res.status(403).json({ success: false, message: 'Account is not active' });
    }

    // Update last login
    await pool.query('UPDATE users SET last_login = NOW(), login_attempts = 0 WHERE id = ?', [user.id]);

    const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, JWT_SECRET, { expiresIn: '24h' });

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: { id: user.id, username: user.username, email: user.email, full_name: user.full_name, role: user.role }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Server error: ' + error.message });
  }
});

// Register
router.post('/register', async (req, res) => {
  try {
    const { username, password, email, full_name } = req.body;

    if (!username || !password || !email || !full_name) {
      return res.status(400).json({ success: false, message: 'All fields required' });
    }

    const [existing] = await pool.query('SELECT id FROM users WHERE username = ? OR email = ?', [username, email]);
    if (existing.length > 0) {
      return res.status(400).json({ success: false, message: 'Username or email already exists' });
    }

    const hash = await bcrypt.hash(password, 10);
    await pool.query(
      'INSERT INTO users (username, password, email, full_name, role, status) VALUES (?, ?, ?, ?, ?, ?)',
      [username, hash, email, full_name, 'User', 'Pending']
    );

    res.json({ success: true, message: 'Registration successful. Awaiting admin approval.' });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ success: false, message: 'Server error: ' + error.message });
  }
});

// Get current user
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const [users] = await pool.query('SELECT id, username, email, full_name, role FROM users WHERE id = ?', [req.user.id]);
    if (users.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.json({ success: true, user: users[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Change password
router.post('/change-password', authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const [users] = await pool.query('SELECT * FROM users WHERE id = ?', [req.user.id]);
    
    if (users.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const isValid = await bcrypt.compare(currentPassword, users[0].password);
    if (!isValid) {
      return res.status(400).json({ success: false, message: 'Current password is incorrect' });
    }

    const hash = await bcrypt.hash(newPassword, 10);
    await pool.query('UPDATE users SET password = ? WHERE id = ?', [hash, req.user.id]);

    res.json({ success: true, message: 'Password changed successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get pending users (admin only)
router.get('/pending-users', authenticateToken, async (req, res) => {
  try {
    const [users] = await pool.query('SELECT id, username, email, full_name, created_at FROM users WHERE status = ?', ['Pending']);
    res.json({ success: true, users });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get all users (admin only)
router.get('/users', authenticateToken, async (req, res) => {
  try {
    const [users] = await pool.query('SELECT id, username, email, full_name, role, status, created_at FROM users');
    res.json({ success: true, users });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get pending count
router.get('/pending-count', authenticateToken, async (req, res) => {
  try {
    const [result] = await pool.query('SELECT COUNT(*) as count FROM users WHERE status = ?', ['Pending']);
    res.json({ success: true, count: result[0].count });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Approve user
router.post('/approve/:userId', authenticateToken, async (req, res) => {
  try {
    await pool.query('UPDATE users SET status = ?, approved_by = ?, approved_at = NOW() WHERE id = ?', ['Active', req.user.id, req.params.userId]);
    res.json({ success: true, message: 'User approved' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Reject user
router.post('/reject/:userId', authenticateToken, async (req, res) => {
  try {
    await pool.query('UPDATE users SET status = ?, rejection_reason = ? WHERE id = ?', ['Rejected', req.body.reason || '', req.params.userId]);
    res.json({ success: true, message: 'User rejected' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Suspend user
router.post('/suspend/:userId', authenticateToken, async (req, res) => {
  try {
    await pool.query('UPDATE users SET status = ? WHERE id = ?', ['Suspended', req.params.userId]);
    res.json({ success: true, message: 'User suspended' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Reactivate user
router.post('/reactivate/:userId', authenticateToken, async (req, res) => {
  try {
    await pool.query('UPDATE users SET status = ? WHERE id = ?', ['Active', req.params.userId]);
    res.json({ success: true, message: 'User reactivated' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Delete user
router.delete('/users/:userId', authenticateToken, async (req, res) => {
  try {
    await pool.query('DELETE FROM users WHERE id = ?', [req.params.userId]);
    res.json({ success: true, message: 'User deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
