const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const pool = require('../database/connection');
const { authenticateToken, isAdmin } = require('../middleware/authMiddleware');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-26-07';

// Login with approval check
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username and password are required'
      });
    }

    // Find user
    const [users] = await pool.query(
      'SELECT * FROM users WHERE username = ?',
      [username]
    );

    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid username or password'
      });
    }

    const user = users[0];

    // Check if account is locked
    if (user.locked_until && new Date(user.locked_until) > new Date()) {
      const lockTime = Math.ceil((new Date(user.locked_until) - new Date()) / 60000);
      return res.status(423).json({
        success: false,
        message: `Account is locked. Try again in ${lockTime} minutes.`
      });
    }

    // Verify password
    const isValid = await bcrypt.compare(password, user.password);
    
    if (!isValid) {
      // Increment login attempts
      const attempts = (user.login_attempts || 0) + 1;
      if (attempts >= 5) {
        // Lock account for 30 minutes
        await pool.query(
          'UPDATE users SET login_attempts = ?, locked_until = DATE_ADD(NOW(), INTERVAL 30 MINUTE) WHERE id = ?',
          [attempts, user.id]
        );
        return res.status(423).json({
          success: false,
          message: 'Account locked due to too many failed attempts. Try again in 30 minutes.'
        });
      }
      await pool.query('UPDATE users SET login_attempts = ? WHERE id = ?', [attempts, user.id]);
      
      return res.status(401).json({
        success: false,
        message: 'Invalid username or password'
      });
    }

    // Check approval status
    if (user.status === 'Pending') {
      return res.status(403).json({
        success: false,
        message: 'Your account is pending approval. Please wait for an administrator to approve your registration.',
        status: 'pending'
      });
    }

    if (user.status === 'Rejected') {
      return res.status(403).json({
        success: false,
        message: user.rejection_reason || 'Your registration has been rejected. Please contact the administrator.',
        status: 'rejected'
      });
    }

    if (user.status === 'Suspended') {
      return res.status(403).json({
        success: false,
        message: 'Your account has been suspended. Please contact the administrator.',
        status: 'suspended'
      });
    }

    if (user.status !== 'Active') {
      return res.status(403).json({
        success: false,
        message: 'Account is not active'
      });
    }

    // Reset login attempts and update last login
    await pool.query(
      'UPDATE users SET login_attempts = 0, locked_until = NULL, last_login = NOW() WHERE id = ?',
      [user.id]
    );

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
        full_name: user.full_name,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Login failed' });
  }
});

// Register new user (requires admin approval)
router.post('/register', async (req, res) => {
  try {
    const { username, password, email, full_name, phone } = req.body;

    if (!username || !password || !email || !full_name) {
      return res.status(400).json({
        success: false,
        message: 'Username, password, email, and full name are required'
      });
    }

    // Check if username exists
    const [existingUser] = await pool.query(
      'SELECT id FROM users WHERE username = ?',
      [username]
    );
    if (existingUser.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Username already exists'
      });
    }

    // Check if email exists
    const [existingEmail] = await pool.query(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );
    if (existingEmail.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Email already registered'
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user with pending status
    const [result] = await pool.query(`
      INSERT INTO users (username, password, email, full_name, phone, role, status)
      VALUES (?, ?, ?, ?, ?, 'User', 'Pending')
    `, [username, hashedPassword, email, full_name, phone || null]);

    res.status(201).json({
      success: true,
      message: 'Registration submitted successfully. Please wait for administrator approval.',
      data: { id: result.insertId, username, email, full_name, status: 'Pending' }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ success: false, message: 'Registration failed' });
  }
});

// Get current user info
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const [users] = await pool.query(
      'SELECT id, username, email, full_name, phone, role, status, last_login, created_at FROM users WHERE id = ?',
      [req.user.id]
    );
    
    if (users.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({ success: true, user: users[0] });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ success: false, message: 'Error fetching user info' });
  }
});

// Change password
router.post('/change-password', authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current and new password are required'
      });
    }

    // Get current user
    const [users] = await pool.query('SELECT * FROM users WHERE id = ?', [req.user.id]);
    if (users.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Verify current password
    const isValid = await bcrypt.compare(currentPassword, users[0].password);
    if (!isValid) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Update password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await pool.query('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, req.user.id]);

    res.json({ success: true, message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ success: false, message: 'Failed to change password' });
  }
});

// ==================== ADMIN ROUTES ====================

// Get all pending users (Admin only)
router.get('/pending-users', authenticateToken, isAdmin, async (req, res) => {
  try {
    const [users] = await pool.query(`
      SELECT id, username, email, full_name, phone, role, status, created_at 
      FROM users 
      WHERE status = 'Pending'
      ORDER BY created_at ASC
    `);
    res.json({ success: true, data: users });
  } catch (error) {
    console.error('Error fetching pending users:', error);
    res.status(500).json({ success: false, message: 'Error fetching pending users' });
  }
});

// Get all users (Admin only)
router.get('/users', authenticateToken, isAdmin, async (req, res) => {
  try {
    const [users] = await pool.query(`
      SELECT u.id, u.username, u.email, u.full_name, u.phone, u.role, u.status, 
             u.last_login, u.created_at, u.approved_at,
             a.username as approved_by_username
      FROM users u
      LEFT JOIN users a ON u.approved_by = a.id
      ORDER BY u.created_at DESC
    `);
    res.json({ success: true, data: users });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ success: false, message: 'Error fetching users' });
  }
});

// Approve user (Admin only)
router.post('/approve/:userId', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;

    const [result] = await pool.query(`
      UPDATE users 
      SET status = 'Active', 
          role = COALESCE(?, role),
          approved_by = ?,
          approved_at = NOW()
      WHERE id = ? AND status = 'Pending'
    `, [role || 'User', req.user.id, userId]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'User not found or already processed' });
    }

    res.json({ success: true, message: 'User approved successfully' });
  } catch (error) {
    console.error('Error approving user:', error);
    res.status(500).json({ success: false, message: 'Error approving user' });
  }
});

// Reject user (Admin only)
router.post('/reject/:userId', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const { reason } = req.body;

    const [result] = await pool.query(`
      UPDATE users 
      SET status = 'Rejected',
          rejection_reason = ?,
          approved_by = ?,
          approved_at = NOW()
      WHERE id = ? AND status = 'Pending'
    `, [reason || 'Registration rejected by administrator', req.user.id, userId]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'User not found or already processed' });
    }

    res.json({ success: true, message: 'User rejected' });
  } catch (error) {
    console.error('Error rejecting user:', error);
    res.status(500).json({ success: false, message: 'Error rejecting user' });
  }
});

// Suspend user (Admin only)
router.post('/suspend/:userId', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { userId } = req.params;

    // Can't suspend yourself
    if (parseInt(userId) === req.user.id) {
      return res.status(400).json({ success: false, message: 'Cannot suspend your own account' });
    }

    const [result] = await pool.query(
      'UPDATE users SET status = ? WHERE id = ?',
      ['Suspended', userId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({ success: true, message: 'User suspended' });
  } catch (error) {
    console.error('Error suspending user:', error);
    res.status(500).json({ success: false, message: 'Error suspending user' });
  }
});

// Reactivate user (Admin only)
router.post('/reactivate/:userId', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { userId } = req.params;

    const [result] = await pool.query(
      'UPDATE users SET status = ?, login_attempts = 0, locked_until = NULL WHERE id = ?',
      ['Active', userId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({ success: true, message: 'User reactivated' });
  } catch (error) {
    console.error('Error reactivating user:', error);
    res.status(500).json({ success: false, message: 'Error reactivating user' });
  }
});

// Delete user (Admin only)
router.delete('/users/:userId', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { userId } = req.params;

    // Can't delete yourself
    if (parseInt(userId) === req.user.id) {
      return res.status(400).json({ success: false, message: 'Cannot delete your own account' });
    }

    const [result] = await pool.query('DELETE FROM users WHERE id = ?', [userId]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({ success: true, message: 'User deleted' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ success: false, message: 'Error deleting user' });
  }
});

// Update user role (Admin only)
router.put('/users/:userId/role', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;

    if (!['Admin', 'Manager', 'User'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role' });
    }

    const [result] = await pool.query(
      'UPDATE users SET role = ? WHERE id = ?',
      [role, userId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({ success: true, message: 'User role updated' });
  } catch (error) {
    console.error('Error updating role:', error);
    res.status(500).json({ success: false, message: 'Error updating role' });
  }
});

// Get pending count (for badge)
router.get('/pending-count', authenticateToken, isAdmin, async (req, res) => {
  try {
    const [result] = await pool.query(
      'SELECT COUNT(*) as count FROM users WHERE status = ?',
      ['Pending']
    );
    res.json({ success: true, count: result[0].count });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error' });
  }
});

module.exports = router;
