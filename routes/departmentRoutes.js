const express = require('express');
const router = express.Router();
const Department = require('../models/Department');
const { body, validationResult } = require('express-validator');

// Validation middleware
const validateDepartment = [
  body('D_No').notEmpty().withMessage('Department number is required'),
  body('Name').notEmpty().withMessage('Department name is required')
];

// Get all departments
router.get('/', async (req, res) => {
  try {
    const departments = await Department.getAll();
    res.json({
      success: true,
      count: departments.length,
      data: departments
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get department by ID
router.get('/:dNo', async (req, res) => {
  try {
    const department = await Department.getById(req.params.dNo);
    if (!department) {
      return res.status(404).json({ success: false, error: 'Department not found' });
    }
    res.json({
      success: true,
      data: department
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get department employees
router.get('/:dNo/employees', async (req, res) => {
  try {
    const employees = await Department.getEmployees(req.params.dNo);
    res.json({
      success: true,
      count: employees.length,
      data: employees
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get department projects
router.get('/:dNo/projects', async (req, res) => {
  try {
    const projects = await Department.getProjects(req.params.dNo);
    res.json({
      success: true,
      count: projects.length,
      data: projects
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get department statistics
router.get('/:dNo/statistics', async (req, res) => {
  try {
    const stats = await Department.getStatistics(req.params.dNo);
    if (!stats) {
      return res.status(404).json({ success: false, error: 'Department not found' });
    }
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create new department
router.post('/', validateDepartment, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const dNo = await Department.create(req.body);
    const department = await Department.getById(dNo);
    res.status(201).json({
      success: true,
      message: 'Department created successfully',
      data: department
    });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ success: false, error: 'Department number already exists' });
    }
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update department
router.put('/:dNo', async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const affectedRows = await Department.update(req.params.dNo, req.body);
    if (affectedRows === 0) {
      return res.status(404).json({ success: false, error: 'Department not found' });
    }
    const department = await Department.getById(req.params.dNo);
    res.json({
      success: true,
      message: 'Department updated successfully',
      data: department
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Delete department
router.delete('/:dNo', async (req, res) => {
  try {
    const affectedRows = await Department.delete(req.params.dNo);
    if (affectedRows === 0) {
      return res.status(404).json({ success: false, error: 'Department not found' });
    }
    res.json({
      success: true,
      message: 'Department deleted successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
