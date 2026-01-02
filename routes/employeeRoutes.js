const express = require('express');
const router = express.Router();
const Employee = require('../models/Employee');
const Works = require('../models/Works');
const Manages = require('../models/Manages');

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
    console.error('Error fetching employees:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Search employees
router.get('/search', async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) {
      return res.status(400).json({ success: false, error: 'Search term required' });
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

// Get cities
router.get('/cities', async (req, res) => {
  try {
    const cities = await Employee.getCities();
    res.json({
      success: true,
      data: cities
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get top managers (no manager above them)
router.get('/top-managers', async (req, res) => {
  try {
    const managers = await Employee.getTopManagers();
    res.json({
      success: true,
      count: managers.length,
      data: managers
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

// Get work history for employee
router.get('/:id/works', async (req, res) => {
  try {
    const works = await Employee.getWorkHistory(req.params.id);
    res.json({
      success: true,
      count: works.length,
      data: works
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get subordinates for employee
router.get('/:id/subordinates', async (req, res) => {
  try {
    const subordinates = await Employee.getSubordinates(req.params.id);
    res.json({
      success: true,
      count: subordinates.length,
      data: subordinates
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get manager for employee
router.get('/:id/manager', async (req, res) => {
  try {
    const manager = await Manages.getManager(req.params.id);
    res.json({
      success: true,
      data: manager || null
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create employee
router.post('/', async (req, res) => {
  try {
    const { emp_name, street_no, city } = req.body;

    if (!emp_name) {
      return res.status(400).json({
        success: false,
        error: 'Employee name is required'
      });
    }

    const empId = await Employee.create({ emp_name, street_no, city });
    const employee = await Employee.getById(empId);

    res.status(201).json({
      success: true,
      message: 'Employee created successfully',
      data: employee
    });
  } catch (error) {
    console.error('Error creating employee:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update employee
router.put('/:id', async (req, res) => {
  try {
    const { emp_name, street_no, city, manager_id } = req.body;

    if (!emp_name) {
      return res.status(400).json({
        success: false,
        error: 'Employee name is required'
      });
    }

    const affectedRows = await Employee.update(req.params.id, { emp_name, street_no, city });
    if (affectedRows === 0) {
      return res.status(404).json({ success: false, error: 'Employee not found' });
    }

    // Update manager if provided
    if (manager_id !== undefined) {
      if (manager_id) {
        await Manages.create(req.params.id, manager_id);
      } else {
        await Manages.delete(req.params.id);
      }
    }

    const employee = await Employee.getById(req.params.id);
    res.json({
      success: true,
      message: 'Employee updated successfully',
      data: employee
    });
  } catch (error) {
    console.error('Error updating employee:', error);
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
    console.error('Error deleting employee:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
