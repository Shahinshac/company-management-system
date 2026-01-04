const db = require('../database/connection');

class Notification {
  // Get all notifications for a user
  static async getByUser(userId, limit = 50) {
    const [rows] = await db.query(`
      SELECT * FROM notifications
      WHERE user_id = ? OR user_id IS NULL
      ORDER BY created_at DESC
      LIMIT ?
    `, [userId, limit]);
    return rows;
  }

  // Get unread notifications count
  static async getUnreadCount(userId) {
    const [result] = await db.query(`
      SELECT COUNT(*) as count FROM notifications
      WHERE (user_id = ? OR user_id IS NULL) AND is_read = FALSE
    `, [userId]);
    return result[0].count;
  }

  // Create notification
  static async create(data) {
    const [result] = await db.query(`
      INSERT INTO notifications (
        user_id, emp_id, type, title, message, 
        link, priority, expires_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      data.user_id || null,
      data.emp_id || null,
      data.type || 'info',
      data.title,
      data.message,
      data.link || null,
      data.priority || 'normal',
      data.expires_at || null
    ]);
    return { id: result.insertId, ...data };
  }

  // Create bulk notifications (for all users or specific group)
  static async createBulk(data, userIds = null) {
    if (userIds && userIds.length > 0) {
      const values = userIds.map(userId => [
        userId, data.emp_id || null, data.type || 'info',
        data.title, data.message, data.link || null,
        data.priority || 'normal', data.expires_at || null
      ]);
      
      const [result] = await db.query(`
        INSERT INTO notifications (user_id, emp_id, type, title, message, link, priority, expires_at)
        VALUES ?
      `, [values]);
      return result.affectedRows;
    } else {
      // Broadcast to all
      return await this.create({ ...data, user_id: null });
    }
  }

  // Mark as read
  static async markAsRead(id) {
    const [result] = await db.query(`
      UPDATE notifications SET is_read = TRUE, read_at = NOW()
      WHERE id = ?
    `, [id]);
    return result.affectedRows > 0;
  }

  // Mark all as read for user
  static async markAllAsRead(userId) {
    const [result] = await db.query(`
      UPDATE notifications SET is_read = TRUE, read_at = NOW()
      WHERE (user_id = ? OR user_id IS NULL) AND is_read = FALSE
    `, [userId]);
    return result.affectedRows;
  }

  // Delete notification
  static async delete(id) {
    const [result] = await db.query('DELETE FROM notifications WHERE id = ?', [id]);
    return result.affectedRows > 0;
  }

  // Delete old notifications
  static async deleteExpired() {
    const [result] = await db.query(`
      DELETE FROM notifications 
      WHERE expires_at IS NOT NULL AND expires_at < NOW()
    `);
    return result.affectedRows;
  }

  // Create system notification helpers
  static async notifyLeaveRequest(leaveData) {
    return await this.create({
      type: 'leave',
      title: 'New Leave Request',
      message: `Leave request from ${leaveData.emp_name} for ${leaveData.leave_type}`,
      link: '/leaves',
      priority: 'high'
    });
  }

  static async notifyLeaveApproval(leaveData, approved) {
    return await this.create({
      emp_id: leaveData.emp_id,
      type: 'leave',
      title: `Leave ${approved ? 'Approved' : 'Rejected'}`,
      message: `Your ${leaveData.leave_type} leave request has been ${approved ? 'approved' : 'rejected'}`,
      link: '/leaves',
      priority: 'normal'
    });
  }

  static async notifyBirthday(employee) {
    return await this.create({
      type: 'birthday',
      title: '🎂 Birthday Today!',
      message: `Today is ${employee.emp_name}'s birthday!`,
      priority: 'low'
    });
  }

  static async notifyAnniversary(employee, years) {
    return await this.create({
      type: 'anniversary',
      title: '🎉 Work Anniversary!',
      message: `${employee.emp_name} completes ${years} year(s) with us today!`,
      priority: 'low'
    });
  }

  static async notifyDocumentExpiry(document) {
    return await this.create({
      emp_id: document.emp_id,
      type: 'document',
      title: '⚠️ Document Expiring Soon',
      message: `${document.name} expires on ${document.expiry_date}`,
      link: '/documents',
      priority: 'high'
    });
  }

  // Get upcoming birthdays
  static async getUpcomingBirthdays(days = 7) {
    const [rows] = await db.query(`
      SELECT emp_id, emp_name, date_of_birth, photo_url, department
      FROM employee
      WHERE date_of_birth IS NOT NULL
        AND status = 'Active'
        AND (
          (MONTH(date_of_birth) = MONTH(CURDATE()) AND DAY(date_of_birth) >= DAY(CURDATE()))
          OR (MONTH(date_of_birth) = MONTH(DATE_ADD(CURDATE(), INTERVAL ? DAY)) AND DAY(date_of_birth) <= DAY(DATE_ADD(CURDATE(), INTERVAL ? DAY)))
        )
      ORDER BY MONTH(date_of_birth), DAY(date_of_birth)
    `, [days, days]);
    return rows;
  }

  // Get upcoming anniversaries
  static async getUpcomingAnniversaries(days = 7) {
    const [rows] = await db.query(`
      SELECT emp_id, emp_name, hire_date, photo_url, department,
        YEAR(CURDATE()) - YEAR(hire_date) as years
      FROM employee
      WHERE hire_date IS NOT NULL
        AND status = 'Active'
        AND (
          (MONTH(hire_date) = MONTH(CURDATE()) AND DAY(hire_date) >= DAY(CURDATE()))
          OR (MONTH(hire_date) = MONTH(DATE_ADD(CURDATE(), INTERVAL ? DAY)) AND DAY(hire_date) <= DAY(DATE_ADD(CURDATE(), INTERVAL ? DAY)))
        )
      ORDER BY MONTH(hire_date), DAY(hire_date)
    `, [days, days]);
    return rows;
  }
}

module.exports = Notification;
