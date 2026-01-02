const db = require('../database/connection');

class AuditLog {
  // Create audit log entry
  static async log(action, entityType, entityId, details, userId = null) {
    const [result] = await db.query(`
      INSERT INTO audit_log (action, entity_type, entity_id, details, user_id, created_at)
      VALUES (?, ?, ?, ?, ?, NOW())
    `, [action, entityType, String(entityId), JSON.stringify(details), userId]);
    return result.insertId;
  }

  // Get all logs with pagination
  static async getAll(page = 1, limit = 50) {
    const offset = (page - 1) * limit;
    const [rows] = await db.query(`
      SELECT al.*, u.username
      FROM audit_log al
      LEFT JOIN users u ON al.user_id = u.id
      ORDER BY al.created_at DESC
      LIMIT ? OFFSET ?
    `, [limit, offset]);
    
    const [countResult] = await db.query('SELECT COUNT(*) as total FROM audit_log');
    
    return {
      logs: rows,
      total: countResult[0].total,
      page,
      totalPages: Math.ceil(countResult[0].total / limit)
    };
  }

  // Get logs by entity type
  static async getByEntityType(entityType, limit = 50) {
    const [rows] = await db.query(`
      SELECT al.*, u.username
      FROM audit_log al
      LEFT JOIN users u ON al.user_id = u.id
      WHERE al.entity_type = ?
      ORDER BY al.created_at DESC
      LIMIT ?
    `, [entityType, limit]);
    return rows;
  }

  // Get logs by entity ID
  static async getByEntityId(entityType, entityId) {
    const [rows] = await db.query(`
      SELECT al.*, u.username
      FROM audit_log al
      LEFT JOIN users u ON al.user_id = u.id
      WHERE al.entity_type = ? AND al.entity_id = ?
      ORDER BY al.created_at DESC
    `, [entityType, String(entityId)]);
    return rows;
  }

  // Get recent activity
  static async getRecent(limit = 20) {
    const [rows] = await db.query(`
      SELECT al.*, u.username
      FROM audit_log al
      LEFT JOIN users u ON al.user_id = u.id
      ORDER BY al.created_at DESC
      LIMIT ?
    `, [limit]);
    return rows;
  }

  // Get activity by user
  static async getByUser(userId, limit = 50) {
    const [rows] = await db.query(`
      SELECT * FROM audit_log
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT ?
    `, [userId, limit]);
    return rows;
  }

  // Get activity summary
  static async getSummary() {
    const [rows] = await db.query(`
      SELECT 
        action,
        entity_type,
        COUNT(*) as count,
        MAX(created_at) as last_occurrence
      FROM audit_log
      GROUP BY action, entity_type
      ORDER BY count DESC
    `);
    return rows;
  }

  // Clean old logs (keep last N days)
  static async cleanOld(days = 90) {
    const [result] = await db.query(`
      DELETE FROM audit_log 
      WHERE created_at < DATE_SUB(NOW(), INTERVAL ? DAY)
    `, [days]);
    return result.affectedRows;
  }
}

module.exports = AuditLog;
