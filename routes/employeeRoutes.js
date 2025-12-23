const express = require('express');
const router = express.Router();
const Employee = require('../models/Employee');
const { body, validationResult } = require('express-validator');

// Validation middleware
const validateEmployee = [
  body('Name').notEmpty().withMessage('Name is required'),
  body('Gender').isIn(['Male', 'Female', 'Other']).withMessage('Invalid gender'),
  body('Email').optional().isEmail().withMessage('Invalid email'),
  body('Salary').optional().isNumeric().withMessage('Salary must be a number')
];

// Get all employees
router.get('/', async (req, res) => {
  try {
    const employees = await Employee.getAll();
    res.json({
      success: true,
      count: employees.length,
      data: employees
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Search employees
router.get('/search', async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) {
      return res.status(400).json({ success: false, error: 'Search term is required' });
    }
    const employees = await Employee.search(q);
    res.json({
      success: true,
      count: employees.length,
      data: employees
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get employee by ID
router.get('/:id', async (req, res) => {
  try {
    const employee = await Employee.getById(req.params.id);
    if (!employee) {
      return res.status(404).json({ success: false, error: 'Employee not found' });
    }
    res.json({
      success: true,
      data: employee
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get employee projects
router.get('/:id/projects', async (req, res) => {
  try {
    const projects = await Employee.getProjects(req.params.id);
    res.json({
      success: true,
      count: projects.length,
      data: projects
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get employee dependents
router.get('/:id/dependents', async (req, res) => {
  try {
    const dependents = await Employee.getDependents(req.params.id);
    res.json({
      success: true,
      count: dependents.length,
      data: dependents
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create new employee
router.post('/', validateEmployee, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    // Validate photo size if provided (max 5MB base64)
    if (req.body.Photo && req.body.Photo.length > 7000000) {
      return res.status(400).json({ success: false, error: 'Photo size too large (max 5MB)' });
    }

    const employeeId = await Employee.create(req.body);
    const employee = await Employee.getById(employeeId);
    res.status(201).json({
      success: true,
      message: 'Employee created successfully',
      data: employee
    });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ success: false, error: 'Email already exists' });
    }
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update employee
router.put('/:id', validateEmployee, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    // Validate photo size if provided (max 5MB base64)
    if (req.body.Photo && req.body.Photo.length > 7000000) {
      return res.status(400).json({ success: false, error: 'Photo size too large (max 5MB)' });
    }

    const affectedRows = await Employee.update(req.params.id, req.body);
    if (affectedRows === 0) {
      return res.status(404).json({ success: false, error: 'Employee not found' });
    }

    // If projects array provided, replace assignments
    if (Array.isArray(req.body.projects)) {
      await Employee.replaceProjects(req.params.id, req.body.projects);
    }

    // If dependents provided, replace dependents
    if (Array.isArray(req.body.dependents)) {
      const Dependent = require('../models/Dependent');
      await Dependent.deleteByEmployee(req.params.id);
      for (const d of req.body.dependents) {
        await Dependent.create({ Employee_Id: req.params.id, D_name: d.D_name, Gender: d.Gender, Relationship: d.Relationship, Date_of_Birth: d.Date_of_Birth });
      }
    }

    const employee = await Employee.getById(req.params.id);
    res.json({
      success: true,
      message: 'Employee updated successfully',
      data: employee
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Delete employee
router.delete('/:id', async (req, res) => {
  try {
    const affectedRows = await Employee.delete(req.params.id);
    if (affectedRows === 0) {
      return res.status(404).json({ success: false, error: 'Employee not found' });
    }
    res.json({
      success: true,
      message: 'Employee deleted successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Assign employee to project
router.post('/:id/projects', async (req, res) => {
  try {
    const { projectNo, hours, role } = req.body;
    if (!projectNo) {
      return res.status(400).json({ success: false, error: 'Project number is required' });
    }
    await Employee.assignToProject(req.params.id, projectNo, hours || 0, role);
    res.json({
      success: true,
      message: 'Employee assigned to project successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Remove employee from project
router.delete('/:id/projects/:projectNo', async (req, res) => {
  try {
    const affectedRows = await Employee.removeFromProject(req.params.id, req.params.projectNo);
    if (affectedRows === 0) {
      return res.status(404).json({ success: false, error: 'Assignment not found' });
    }
    res.json({
      success: true,
      message: 'Employee removed from project successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
