const express = require('express');
const router = express.Router();
const Project = require('../models/Project');
const { body, validationResult } = require('express-validator');

// Validation middleware
const validateProject = [
  body('P_No').notEmpty().withMessage('Project number is required'),
  body('Name').notEmpty().withMessage('Project name is required'),
  body('Status').optional().isIn(['Planning', 'Active', 'Completed', 'On Hold'])
    .withMessage('Invalid status')
];

// Get all projects
router.get('/', async (req, res) => {
  try {
    const projects = await Project.getAll();
    res.json({
      success: true,
      count: projects.length,
      data: projects
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get projects by status
router.get('/status/:status', async (req, res) => {
  try {
    const validStatuses = ['Planning', 'Active', 'Completed', 'On Hold'];
    if (!validStatuses.includes(req.params.status)) {
      return res.status(400).json({ success: false, error: 'Invalid status' });
    }
    const projects = await Project.getByStatus(req.params.status);
    res.json({
      success: true,
      count: projects.length,
      data: projects
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get project by ID
router.get('/:pNo', async (req, res) => {
  try {
    const project = await Project.getById(req.params.pNo);
    if (!project) {
      return res.status(404).json({ success: false, error: 'Project not found' });
    }
    res.json({
      success: true,
      data: project
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get project employees
router.get('/:pNo/employees', async (req, res) => {
  try {
    const employees = await Project.getEmployees(req.params.pNo);
    res.json({
      success: true,
      count: employees.length,
      data: employees
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get project statistics
router.get('/:pNo/statistics', async (req, res) => {
  try {
    const stats = await Project.getStatistics(req.params.pNo);
    if (!stats) {
      return res.status(404).json({ success: false, error: 'Project not found' });
    }
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create new project
router.post('/', validateProject, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const pNo = await Project.create(req.body);
    const project = await Project.getById(pNo);
    res.status(201).json({
      success: true,
      message: 'Project created successfully',
      data: project
    });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ success: false, error: 'Project number already exists' });
    }
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update project
router.put('/:pNo', validateProject, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const affectedRows = await Project.update(req.params.pNo, req.body);
    if (affectedRows === 0) {
      return res.status(404).json({ success: false, error: 'Project not found' });
    }
    const project = await Project.getById(req.params.pNo);
    res.json({
      success: true,
      message: 'Project updated successfully',
      data: project
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update project status
router.patch('/:pNo/status', async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['Planning', 'Active', 'Completed', 'On Hold'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, error: 'Invalid status' });
    }

    const affectedRows = await Project.updateStatus(req.params.pNo, status);
    if (affectedRows === 0) {
      return res.status(404).json({ success: false, error: 'Project not found' });
    }
    const project = await Project.getById(req.params.pNo);
    res.json({
      success: true,
      message: 'Project status updated successfully',
      data: project
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Delete project
router.delete('/:pNo', async (req, res) => {
  try {
    const affectedRows = await Project.delete(req.params.pNo);
    if (affectedRows === 0) {
      return res.status(404).json({ success: false, error: 'Project not found' });
    }
    res.json({
      success: true,
      message: 'Project deleted successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
