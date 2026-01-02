const express = require('express');
const router = express.Router();
const Dependent = require('../models/Dependent');
const { authenticateToken } = require('../middleware/authMiddleware');

// Apply authentication to all routes
router.use(authenticateToken);

// Get all dependents
router.get('/', async (req, res) => {
  try {
    const dependents = await Dependent.getAll();
    res.json({ success: true, data: dependents });
  } catch (error) {
    console.error('Error fetching dependents:', error);
    res.status(500).json({ success: false, message: 'Error fetching dependents' });
  }
});

// Get dependents statistics
router.get('/stats', async (req, res) => {
  try {
    const stats = await Dependent.getStats();
    res.json({ success: true, data: stats });
  } catch (error) {
    console.error('Error fetching dependent stats:', error);
    res.status(500).json({ success: false, message: 'Error fetching statistics' });
  }
});

// Get employees with most dependents
router.get('/by-employee-count', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const data = await Dependent.getEmployeesWithMostDependents(limit);
    res.json({ success: true, data });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ success: false, message: 'Error fetching data' });
  }
});

// Get dependents by employee ID
router.get('/employee/:empId', async (req, res) => {
  try {
    const dependents = await Dependent.getByEmployeeId(req.params.empId);
    res.json({ success: true, data: dependents });
  } catch (error) {
    console.error('Error fetching employee dependents:', error);
    res.status(500).json({ success: false, message: 'Error fetching dependents' });
  }
});

// Get emergency contacts for employee
router.get('/employee/:empId/emergency', async (req, res) => {
  try {
    const contacts = await Dependent.getEmergencyContacts(req.params.empId);
    res.json({ success: true, data: contacts });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ success: false, message: 'Error fetching emergency contacts' });
  }
});

// Get single dependent by ID
router.get('/:id', async (req, res) => {
  try {
    const dependent = await Dependent.getById(req.params.id);
    if (!dependent) {
      return res.status(404).json({ success: false, message: 'Dependent not found' });
    }
    res.json({ success: true, data: dependent });
  } catch (error) {
    console.error('Error fetching dependent:', error);
    res.status(500).json({ success: false, message: 'Error fetching dependent' });
  }
});

// Create new dependent
router.post('/', async (req, res) => {
  try {
    const { emp_id, dependent_name, relationship } = req.body;
    
    if (!emp_id || !dependent_name || !relationship) {
      return res.status(400).json({ 
        success: false, 
        message: 'Employee ID, dependent name, and relationship are required' 
      });
    }
    
    const dependent = await Dependent.create(req.body);
    res.status(201).json({ success: true, data: dependent, message: 'Dependent added successfully' });
  } catch (error) {
    console.error('Error creating dependent:', error);
    res.status(500).json({ success: false, message: 'Error creating dependent' });
  }
});

// Update dependent
router.put('/:id', async (req, res) => {
  try {
    const updated = await Dependent.update(req.params.id, req.body);
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Dependent not found' });
    }
    res.json({ success: true, message: 'Dependent updated successfully' });
  } catch (error) {
    console.error('Error updating dependent:', error);
    res.status(500).json({ success: false, message: 'Error updating dependent' });
  }
});

// Delete dependent
router.delete('/:id', async (req, res) => {
  try {
    const deleted = await Dependent.delete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Dependent not found' });
    }
    res.json({ success: true, message: 'Dependent deleted successfully' });
  } catch (error) {
    console.error('Error deleting dependent:', error);
    res.status(500).json({ success: false, message: 'Error deleting dependent' });
  }
});

module.exports = router;
