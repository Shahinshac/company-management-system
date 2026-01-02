const express = require('express');
const router = express.Router();
const Manages = require('../models/Manages');

// Get all management relationships
router.get('/', async (req, res) => {
  try {
    const manages = await Manages.getAll();
    res.json({
      success: true,
      count: manages.length,
      data: manages
    });
  } catch (error) {
    console.error('Error fetching manages:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get all managers
router.get('/managers', async (req, res) => {
  try {
    const managers = await Manages.getAllManagers();
    res.json({
      success: true,
      count: managers.length,
      data: managers
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get subordinates for a manager
router.get('/subordinates/:managerId', async (req, res) => {
  try {
    const subordinates = await Manages.getSubordinates(req.params.managerId);
    res.json({
      success: true,
      count: subordinates.length,
      data: subordinates
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get hierarchy for a manager
router.get('/hierarchy/:managerId', async (req, res) => {
  try {
    const hierarchy = await Manages.getHierarchy(req.params.managerId);
    res.json({
      success: true,
      data: hierarchy
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get manager for an employee
router.get('/employee/:empId', async (req, res) => {
  try {
    const manager = await Manages.getManager(req.params.empId);
    res.json({
      success: true,
      data: manager || null
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create/Update management relationship
router.post('/', async (req, res) => {
  try {
    const { emp_id, manager_id } = req.body;

    if (!emp_id || !manager_id) {
      return res.status(400).json({
        success: false,
        error: 'Employee ID and manager ID are required'
      });
    }

    // Prevent self-management
    if (emp_id === manager_id) {
      return res.status(400).json({
        success: false,
        error: 'An employee cannot be their own manager'
      });
    }

    await Manages.create(emp_id, manager_id);
    const manager = await Manages.getManager(emp_id);

    res.status(201).json({
      success: true,
      message: 'Management relationship created/updated successfully',
      data: manager
    });
  } catch (error) {
    console.error('Error creating management relationship:', error);
    if (error.code === 'ER_NO_REFERENCED_ROW_2') {
      return res.status(400).json({
        success: false,
        error: 'Invalid employee ID or manager ID'
      });
    }
    res.status(500).json({ success: false, error: error.message });
  }
});

// Delete management relationship
router.delete('/:empId', async (req, res) => {
  try {
    const affectedRows = await Manages.delete(req.params.empId);
    if (affectedRows === 0) {
      return res.status(404).json({ success: false, error: 'Management relationship not found' });
    }
    res.json({
      success: true,
      message: 'Management relationship deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting management relationship:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
