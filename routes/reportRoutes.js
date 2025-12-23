const express = require('express');
const router = express.Router();
const Report = require('../models/Report');
const { authenticateToken, requireAdmin } = require('../middleware/authMiddleware');

// Get all reports (admin only)
router.get('/', authenticateToken, async (req, res) => {
  try {
    // optionally allow non-admin to fetch only their own report
    if (req.user.role !== 'Admin') {
      const rows = await Report.getByEmployee(req.user.id);
      return res.json({ success: true, data: rows });
    }

    const rows = await Report.getAll();
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error('Get reports error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch reports' });
  }
});

// Rebuild reports (admin only)
router.post('/rebuild', authenticateToken, requireAdmin, async (req, res) => {
  try {
    await Report.rebuildAll();
    res.json({ success: true, message: 'Reports rebuilt' });
  } catch (error) {
    console.error('Rebuild reports error:', error);
    res.status(500).json({ success: false, error: 'Failed to rebuild reports' });
  }
});

module.exports = router;
