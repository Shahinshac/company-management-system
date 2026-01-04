const express = require('express');
const router = express.Router();
const Department = require('../models/Department');
const { authenticateToken } = require('../middleware/authMiddleware');

// Apply authentication to all routes
router.use(authenticateToken);

// Get all departments
router.get('/', async (req, res) => {
  try {
    const departments = await Department.getAll();
    res.json({ success: true, data: departments });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get department stats
router.get('/stats', async (req, res) => {
  try {
    const stats = await Department.getStats();
    res.json({ success: true, data: stats });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get department hierarchy
router.get('/hierarchy', async (req, res) => {
  try {
    const hierarchy = await Department.getHierarchy();
    res.json({ success: true, data: hierarchy });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get department by ID
router.get('/:id', async (req, res) => {
  try {
    const department = await Department.getById(req.params.id);
    if (!department) {
      return res.status(404).json({ success: false, error: 'Department not found' });
    }
    res.json({ success: true, data: department });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get employees in department
router.get('/:id/employees', async (req, res) => {
  try {
    const department = await Department.getById(req.params.id);
    if (!department) {
      return res.status(404).json({ success: false, error: 'Department not found' });
    }
    const employees = await Department.getEmployees(department.name);
    res.json({ success: true, data: employees });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create department
router.post('/', async (req, res) => {
  try {
    const department = await Department.create(req.body);
    res.status(201).json({ success: true, data: department });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update department
router.put('/:id', async (req, res) => {
  try {
    await Department.update(req.params.id, req.body);
    res.json({ success: true, message: 'Department updated' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Delete department
router.delete('/:id', async (req, res) => {
  try {
    await Department.delete(req.params.id);
    res.json({ success: true, message: 'Department deleted' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
