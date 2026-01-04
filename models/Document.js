const db = require('../database/connection');

class Document {
  // Get all documents
  static async getAll() {
    const [rows] = await db.query(`
      SELECT d.*, e.emp_name, e.photo_url as emp_photo
      FROM documents d
      LEFT JOIN employee e ON d.emp_id = e.emp_id
      ORDER BY d.created_at DESC
    `);
    return rows;
  }

  // Get documents by employee
  static async getByEmployee(empId) {
    const [rows] = await db.query(`
      SELECT * FROM documents
      WHERE emp_id = ?
      ORDER BY category, name
    `, [empId]);
    return rows;
  }

  // Get document by ID
  static async getById(id) {
    const [rows] = await db.query(`
      SELECT d.*, e.emp_name
      FROM documents d
      LEFT JOIN employee e ON d.emp_id = e.emp_id
      WHERE d.id = ?
    `, [id]);
    return rows[0];
  }

  // Create document
  static async create(data) {
    const [result] = await db.query(`
      INSERT INTO documents (
        emp_id, name, category, file_url, file_type, file_size,
        description, expiry_date, is_verified, verified_by, verified_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      data.emp_id || null,
      data.name,
      data.category || 'Other',
      data.file_url,
      data.file_type || 'pdf',
      data.file_size || 0,
      data.description || null,
      data.expiry_date || null,
      data.is_verified || false,
      data.verified_by || null,
      data.is_verified ? new Date() : null
    ]);
    return { id: result.insertId, ...data };
  }

  // Update document
  static async update(id, data) {
    const fields = [];
    const values = [];

    if (data.name !== undefined) { fields.push('name = ?'); values.push(data.name); }
    if (data.category !== undefined) { fields.push('category = ?'); values.push(data.category); }
    if (data.file_url !== undefined) { fields.push('file_url = ?'); values.push(data.file_url); }
    if (data.description !== undefined) { fields.push('description = ?'); values.push(data.description); }
    if (data.expiry_date !== undefined) { fields.push('expiry_date = ?'); values.push(data.expiry_date); }
    if (data.is_verified !== undefined) { 
      fields.push('is_verified = ?'); 
      values.push(data.is_verified);
      if (data.is_verified) {
        fields.push('verified_at = NOW()');
      }
    }
    if (data.verified_by !== undefined) { fields.push('verified_by = ?'); values.push(data.verified_by); }

    if (fields.length === 0) return false;

    values.push(id);
    const [result] = await db.query(
      `UPDATE documents SET ${fields.join(', ')} WHERE id = ?`,
      values
    );
    return result.affectedRows > 0;
  }

  // Delete document
  static async delete(id) {
    const [result] = await db.query('DELETE FROM documents WHERE id = ?', [id]);
    return result.affectedRows > 0;
  }

  // Get expiring documents
  static async getExpiring(days = 30) {
    const [rows] = await db.query(`
      SELECT d.*, e.emp_name, e.email
      FROM documents d
      JOIN employee e ON d.emp_id = e.emp_id
      WHERE d.expiry_date IS NOT NULL
        AND d.expiry_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL ? DAY)
      ORDER BY d.expiry_date ASC
    `, [days]);
    return rows;
  }

  // Get expired documents
  static async getExpired() {
    const [rows] = await db.query(`
      SELECT d.*, e.emp_name, e.email
      FROM documents d
      JOIN employee e ON d.emp_id = e.emp_id
      WHERE d.expiry_date IS NOT NULL AND d.expiry_date < CURDATE()
      ORDER BY d.expiry_date ASC
    `);
    return rows;
  }

  // Get documents by category
  static async getByCategory(category) {
    const [rows] = await db.query(`
      SELECT d.*, e.emp_name
      FROM documents d
      LEFT JOIN employee e ON d.emp_id = e.emp_id
      WHERE d.category = ?
      ORDER BY d.created_at DESC
    `, [category]);
    return rows;
  }

  // Get document categories
  static getCategories() {
    return [
      'ID Proof',
      'Address Proof',
      'Educational',
      'Professional',
      'Medical',
      'Contract',
      'Visa',
      'License',
      'Certificate',
      'Tax Document',
      'Bank Document',
      'Insurance',
      'Other'
    ];
  }

  // Get document stats
  static async getStats() {
    const [stats] = await db.query(`
      SELECT 
        COUNT(*) as total_documents,
        SUM(CASE WHEN expiry_date IS NOT NULL AND expiry_date < CURDATE() THEN 1 ELSE 0 END) as expired,
        SUM(CASE WHEN expiry_date IS NOT NULL AND expiry_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 30 DAY) THEN 1 ELSE 0 END) as expiring_soon,
        SUM(CASE WHEN is_verified = 1 THEN 1 ELSE 0 END) as verified,
        SUM(CASE WHEN is_verified = 0 OR is_verified IS NULL THEN 1 ELSE 0 END) as pending_verification
      FROM documents
    `);
    return stats[0];
  }

  // Verify document
  static async verify(id, verifiedBy) {
    const [result] = await db.query(`
      UPDATE documents 
      SET is_verified = TRUE, verified_by = ?, verified_at = NOW()
      WHERE id = ?
    `, [verifiedBy, id]);
    return result.affectedRows > 0;
  }
}

module.exports = Document;
