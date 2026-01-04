const express = require('express');
const router = express.Router();
const Leave = require('../models/Leave');
const { authenticateToken } = require('../middleware/authMiddleware');

// Apply authentication to all routes
router.use(authenticateToken);

// Get all leave requests
router.get('/', async (req, res) => {
  try {
    const leaves = await Leave.getAll();
    res.json({ success: true, data: leaves });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get pending requests
router.get('/pending', async (req, res) => {
  try {
    const leaves = await Leave.getPending();
    res.json({ success: true, data: leaves });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get leave statistics
router.get('/stats', async (req, res) => {
  try {
    const year = req.query.year || new Date().getFullYear();
    const stats = await Leave.getStats(year);
    res.json({ success: true, data: stats });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get holidays
router.get('/holidays', async (req, res) => {
  try {
    const year = req.query.year || new Date().getFullYear();
    const holidays = await Leave.getHolidays(year);
    res.json({ success: true, data: holidays });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Add holiday
router.post('/holidays', async (req, res) => {
  try {
    const holiday = await Leave.addHoliday(req.body);
    res.status(201).json({ success: true, data: holiday });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Delete holiday
router.delete('/holidays/:id', async (req, res) => {
  try {
    await Leave.deleteHoliday(req.params.id);
    res.json({ success: true, message: 'Holiday deleted' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get leave by employee
router.get('/employee/:empId', async (req, res) => {
  try {
    const leaves = await Leave.getByEmployee(req.params.empId);
    res.json({ success: true, data: leaves });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get leave balance for employee
router.get('/balance/:empId', async (req, res) => {
  try {
    const year = req.query.year || new Date().getFullYear();
    const balance = await Leave.getBalance(req.params.empId, year);
    res.json({ success: true, data: balance });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Initialize leave balance
router.post('/balance/:empId', async (req, res) => {
  try {
    const year = req.body.year || new Date().getFullYear();
    await Leave.initializeBalance(req.params.empId, year);
    res.json({ success: true, message: 'Leave balance initialized' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get single leave request
router.get('/:id', async (req, res) => {
  try {
    const leave = await Leave.getById(req.params.id);
    if (!leave) {
      return res.status(404).json({ success: false, error: 'Leave request not found' });
    }
    res.json({ success: true, data: leave });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create leave request
router.post('/', async (req, res) => {
  try {
    const leave = await Leave.create(req.body);
    res.status(201).json({ success: true, data: leave });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Approve/Reject leave request
router.put('/:id/status', async (req, res) => {
  try {
    const { status, comments } = req.body;
    const approvedBy = req.user?.emp_id || null;
    await Leave.updateStatus(req.params.id, status, approvedBy, comments);
    res.json({ success: true, message: `Leave ${status.toLowerCase()}` });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Delete leave request
router.delete('/:id', async (req, res) => {
  try {
    await Leave.delete(req.params.id);
    res.json({ success: true, message: 'Leave request deleted' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ===== ATTENDANCE ROUTES =====

// Get all attendance for a month/year (overview)
router.get('/attendance/all', async (req, res) => {
  try {
    const { month, year } = req.query;
    const attendance = await Leave.getAllAttendance(
      month || new Date().getMonth() + 1,
      year || new Date().getFullYear()
    );
    res.json({ success: true, data: attendance });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get overall attendance summary
router.get('/attendance/summary', async (req, res) => {
  try {
    const { month, year } = req.query;
    const summary = await Leave.getOverallAttendanceSummary(
      month || new Date().getMonth() + 1,
      year || new Date().getFullYear()
    );
    res.json({ success: true, data: summary });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get attendance for employee
router.get('/attendance/:empId', async (req, res) => {
  try {
    const { month, year } = req.query;
    const attendance = await Leave.getAttendance(
      req.params.empId,
      month || new Date().getMonth() + 1,
      year || new Date().getFullYear()
    );
    res.json({ success: true, data: attendance });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get attendance summary
router.get('/attendance/:empId/summary', async (req, res) => {
  try {
    const { month, year } = req.query;
    const summary = await Leave.getAttendanceSummary(
      req.params.empId,
      month || new Date().getMonth() + 1,
      year || new Date().getFullYear()
    );
    res.json({ success: true, data: summary });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Record attendance
router.post('/attendance', async (req, res) => {
  try {
    await Leave.recordAttendance(req.body);
    res.json({ success: true, message: 'Attendance recorded' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
