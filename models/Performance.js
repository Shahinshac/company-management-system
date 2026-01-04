const db = require('../database/connection');

class Performance {
  // Get all reviews
  static async getAll() {
    const [rows] = await db.query(`
      SELECT p.*, 
        e.emp_name, e.photo_url, e.department, e.job_title,
        reviewer.emp_name as reviewer_name
      FROM performance_reviews p
      JOIN employee e ON p.emp_id = e.emp_id
      LEFT JOIN employee reviewer ON p.reviewer_id = reviewer.emp_id
      ORDER BY p.review_date DESC
    `);
    return rows;
  }

  // Get reviews by employee
  static async getByEmployee(empId) {
    const [rows] = await db.query(`
      SELECT p.*, reviewer.emp_name as reviewer_name
      FROM performance_reviews p
      LEFT JOIN employee reviewer ON p.reviewer_id = reviewer.emp_id
      WHERE p.emp_id = ?
      ORDER BY p.review_date DESC
    `, [empId]);
    return rows;
  }

  // Get single review
  static async getById(id) {
    const [rows] = await db.query(`
      SELECT p.*, 
        e.emp_name, e.department, e.job_title,
        reviewer.emp_name as reviewer_name
      FROM performance_reviews p
      JOIN employee e ON p.emp_id = e.emp_id
      LEFT JOIN employee reviewer ON p.reviewer_id = reviewer.emp_id
      WHERE p.id = ?
    `, [id]);
    return rows[0];
  }

  // Create review
  static async create(data) {
    const [result] = await db.query(`
      INSERT INTO performance_reviews (
        emp_id, reviewer_id, review_period, review_date, review_type,
        overall_rating, goals_rating, skills_rating, teamwork_rating, communication_rating,
        strengths, areas_for_improvement, goals_achieved, new_goals,
        employee_comments, reviewer_comments, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      data.emp_id,
      data.reviewer_id || null,
      data.review_period,
      data.review_date || new Date(),
      data.review_type || 'Annual',
      data.overall_rating || 0,
      data.goals_rating || 0,
      data.skills_rating || 0,
      data.teamwork_rating || 0,
      data.communication_rating || 0,
      data.strengths || null,
      data.areas_for_improvement || null,
      data.goals_achieved || null,
      data.new_goals || null,
      data.employee_comments || null,
      data.reviewer_comments || null,
      data.status || 'Draft'
    ]);
    return { id: result.insertId, ...data };
  }

  // Update review
  static async update(id, data) {
    const fields = [];
    const values = [];

    const allowedFields = [
      'review_period', 'review_date', 'review_type', 'overall_rating',
      'goals_rating', 'skills_rating', 'teamwork_rating', 'communication_rating',
      'strengths', 'areas_for_improvement', 'goals_achieved', 'new_goals',
      'employee_comments', 'reviewer_comments', 'status'
    ];

    for (const field of allowedFields) {
      if (data[field] !== undefined) {
        fields.push(`${field} = ?`);
        values.push(data[field]);
      }
    }

    if (fields.length === 0) return false;

    values.push(id);
    const [result] = await db.query(
      `UPDATE performance_reviews SET ${fields.join(', ')} WHERE id = ?`,
      values
    );
    return result.affectedRows > 0;
  }

  // Delete review
  static async delete(id) {
    const [result] = await db.query('DELETE FROM performance_reviews WHERE id = ?', [id]);
    return result.affectedRows > 0;
  }

  // Submit review
  static async submit(id) {
    const [result] = await db.query(`
      UPDATE performance_reviews SET status = 'Submitted', submitted_at = NOW()
      WHERE id = ?
    `, [id]);
    return result.affectedRows > 0;
  }

  // Complete review
  static async complete(id) {
    const [result] = await db.query(`
      UPDATE performance_reviews SET status = 'Completed', completed_at = NOW()
      WHERE id = ?
    `, [id]);
    return result.affectedRows > 0;
  }

  // Get goals for employee
  static async getGoals(empId) {
    const [rows] = await db.query(`
      SELECT * FROM performance_goals
      WHERE emp_id = ?
      ORDER BY due_date ASC
    `, [empId]);
    return rows;
  }

  // Create goal
  static async createGoal(data) {
    const [result] = await db.query(`
      INSERT INTO performance_goals (
        emp_id, title, description, category, target_value, 
        current_value, unit, due_date, priority, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      data.emp_id,
      data.title,
      data.description || null,
      data.category || 'Performance',
      data.target_value || null,
      data.current_value || 0,
      data.unit || null,
      data.due_date || null,
      data.priority || 'Medium',
      data.status || 'In Progress'
    ]);
    return { id: result.insertId, ...data };
  }

  // Update goal
  static async updateGoal(id, data) {
    const fields = [];
    const values = [];

    const allowedFields = [
      'title', 'description', 'category', 'target_value',
      'current_value', 'unit', 'due_date', 'priority', 'status'
    ];

    for (const field of allowedFields) {
      if (data[field] !== undefined) {
        fields.push(`${field} = ?`);
        values.push(data[field]);
      }
    }

    if (fields.length === 0) return false;

    values.push(id);
    const [result] = await db.query(
      `UPDATE performance_goals SET ${fields.join(', ')} WHERE id = ?`,
      values
    );
    return result.affectedRows > 0;
  }

  // Delete goal
  static async deleteGoal(id) {
    const [result] = await db.query('DELETE FROM performance_goals WHERE id = ?', [id]);
    return result.affectedRows > 0;
  }

  // Get performance stats
  static async getStats() {
    const [stats] = await db.query(`
      SELECT 
        COUNT(*) as total_reviews,
        AVG(overall_rating) as avg_rating,
        SUM(CASE WHEN status = 'Draft' THEN 1 ELSE 0 END) as draft,
        SUM(CASE WHEN status = 'Submitted' THEN 1 ELSE 0 END) as submitted,
        SUM(CASE WHEN status = 'Completed' THEN 1 ELSE 0 END) as completed
      FROM performance_reviews
    `);
    return stats[0];
  }

  // Get rating distribution
  static async getRatingDistribution() {
    const [rows] = await db.query(`
      SELECT 
        CASE 
          WHEN overall_rating >= 4.5 THEN 'Excellent'
          WHEN overall_rating >= 3.5 THEN 'Good'
          WHEN overall_rating >= 2.5 THEN 'Average'
          WHEN overall_rating >= 1.5 THEN 'Below Average'
          ELSE 'Poor'
        END as rating_category,
        COUNT(*) as count
      FROM performance_reviews
      WHERE status = 'Completed'
      GROUP BY rating_category
      ORDER BY FIELD(rating_category, 'Excellent', 'Good', 'Average', 'Below Average', 'Poor')
    `);
    return rows;
  }

  // Get pending reviews
  static async getPendingReviews() {
    const [rows] = await db.query(`
      SELECT p.*, e.emp_name, e.department
      FROM performance_reviews p
      JOIN employee e ON p.emp_id = e.emp_id
      WHERE p.status IN ('Draft', 'Submitted')
      ORDER BY p.review_date ASC
    `);
    return rows;
  }
}

module.exports = Performance;
