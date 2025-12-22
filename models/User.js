const pool = require('../database/connection');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const User = {
  // Create new user (registration)
  async create(userData) {
    const { username, email, password, role = 'Employee' } = userData;
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const [result] = await pool.query(
      'INSERT INTO USER (Username, Email, Password, Role, Status) VALUES (?, ?, ?, ?, ?)',
      [username, email, hashedPassword, role, 'Pending']
    );
    
    return result.insertId;
  },

  // Find user by email or username
  async findByCredentials(identifier) {
    const [users] = await pool.query(
      'SELECT * FROM USER WHERE Email = ? OR Username = ? LIMIT 1',
      [identifier, identifier]
    );
    return users[0];
  },

  // Find user by ID
  async findById(id) {
    const [users] = await pool.query(
      'SELECT Id, Username, Email, Role, Status, created_at FROM USER WHERE Id = ?',
      [id]
    );
    return users[0];
  },

  // Verify password
  async verifyPassword(plainPassword, hashedPassword) {
    return await bcrypt.compare(plainPassword, hashedPassword);
  },

  // Generate JWT token
  generateToken(user) {
    return jwt.sign(
      { id: user.Id, username: user.Username, email: user.Email, role: user.Role },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );
  },

  // Get all users (admin only)
  async getAll() {
    const [users] = await pool.query(
      'SELECT Id, Username, Email, Role, Status, created_at FROM USER ORDER BY created_at DESC'
    );
    return users;
  },

  // Get pending users (for admin approval)
  async getPendingUsers() {
    const [users] = await pool.query(
      'SELECT Id, Username, Email, Role, Status, created_at FROM USER WHERE Status = "Pending" ORDER BY created_at DESC'
    );
    return users;
  },

  // Approve user
  async approveUser(userId) {
    const [result] = await pool.query(
      'UPDATE USER SET Status = "Approved" WHERE Id = ?',
      [userId]
    );
    return result.affectedRows > 0;
  },

  // Reject user
  async rejectUser(userId) {
    const [result] = await pool.query(
      'UPDATE USER SET Status = "Rejected" WHERE Id = ?',
      [userId]
    );
    return result.affectedRows > 0;
  },

  // Update user role
  async updateRole(userId, role) {
    const [result] = await pool.query(
      'UPDATE USER SET Role = ? WHERE Id = ?',
      [role, userId]
    );
    return result.affectedRows > 0;
  },

  // Delete user
  async delete(userId) {
    const [result] = await pool.query(
      'DELETE FROM USER WHERE Id = ?',
      [userId]
    );
    return result.affectedRows > 0;
  },

  // Check if email exists
  async emailExists(email) {
    const [users] = await pool.query(
      'SELECT Id FROM USER WHERE Email = ?',
      [email]
    );
    return users.length > 0;
  },

  // Check if username exists
  async usernameExists(username) {
    const [users] = await pool.query(
      'SELECT Id FROM USER WHERE Username = ?',
      [username]
    );
    return users.length > 0;
  }
};

module.exports = User;
