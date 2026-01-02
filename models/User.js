const db = require('../database/connection');
const bcrypt = require('bcryptjs');

class User {
  // Get all users
  static async getAll() {
    const [rows] = await db.query(`
      SELECT u.id, u.username, u.email, u.role, u.status, u.emp_id, 
             u.created_at, u.updated_at, e.emp_name
      FROM users u
      LEFT JOIN employee e ON u.emp_id = e.emp_id
      ORDER BY u.username
    `);
    return rows;
  }

  // Get user by ID
  static async getById(id) {
    const [rows] = await db.query(`
      SELECT u.id, u.username, u.email, u.role, u.status, u.emp_id,
             u.created_at, u.updated_at, e.emp_name
      FROM users u
      LEFT JOIN employee e ON u.emp_id = e.emp_id
      WHERE u.id = ?
    `, [id]);
    return rows[0];
  }

  // Get user by username
  static async getByUsername(username) {
    const [rows] = await db.query(`
      SELECT * FROM users WHERE username = ?
    `, [username]);
    return rows[0];
  }

  // Get user by email
  static async getByEmail(email) {
    const [rows] = await db.query(`
      SELECT * FROM users WHERE email = ?
    `, [email]);
    return rows[0];
  }

  // Create new user
  static async create(userData) {
    const { username, password, email, role, emp_id } = userData;
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const [result] = await db.query(`
      INSERT INTO users (username, password, email, role, emp_id) 
      VALUES (?, ?, ?, ?, ?)
    `, [username, hashedPassword, email || null, role || 'User', emp_id || null]);
    
    return result.insertId;
  }

  // Update user
  static async update(id, userData) {
    const { username, email, role, status, emp_id } = userData;
    const [result] = await db.query(`
      UPDATE users 
      SET username = ?, email = ?, role = ?, status = ?, emp_id = ?
      WHERE id = ?
    `, [username, email || null, role || 'User', status || 'Active', emp_id || null, id]);
    return result.affectedRows;
  }

  // Update password
  static async updatePassword(id, newPassword) {
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    const [result] = await db.query(`
      UPDATE users SET password = ? WHERE id = ?
    `, [hashedPassword, id]);
    return result.affectedRows;
  }

  // Delete user
  static async delete(id) {
    const [result] = await db.query('DELETE FROM users WHERE id = ?', [id]);
    return result.affectedRows;
  }

  // Verify password
  static async verifyPassword(username, password) {
    const user = await this.getByUsername(username);
    if (!user) return null;
    
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) return null;
    
    // Return user without password
    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  // Check if username exists
  static async usernameExists(username, excludeId = null) {
    let query = 'SELECT COUNT(*) as count FROM users WHERE username = ?';
    const params = [username];
    
    if (excludeId) {
      query += ' AND id != ?';
      params.push(excludeId);
    }
    
    const [rows] = await db.query(query, params);
    return rows[0].count > 0;
  }

  // Check if email exists
  static async emailExists(email, excludeId = null) {
    if (!email) return false;
    
    let query = 'SELECT COUNT(*) as count FROM users WHERE email = ?';
    const params = [email];
    
    if (excludeId) {
      query += ' AND id != ?';
      params.push(excludeId);
    }
    
    const [rows] = await db.query(query, params);
    return rows[0].count > 0;
  }
}

module.exports = User;
