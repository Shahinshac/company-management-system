const express = require('express');
const router = express.Router();
const Works = require('../models/Works');

// Get all work relationships
router.get('/', async (req, res) => {
  try {
    const works = await Works.getAll();
    res.json({
      success: true,
      count: works.length,
      data: works
    });
  } catch (error) {
    console.error('Error fetching works:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get salary statistics by company
router.get('/stats', async (req, res) => {
  try {
    const stats = await Works.getSalaryStatsByCompany();
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get high earners
router.get('/high-earners', async (req, res) => {
  try {
    const minSalary = parseInt(req.query.min) || 50000;
    const highEarners = await Works.getHighEarners(minSalary);
    res.json({
      success: true,
      count: highEarners.length,
      data: highEarners
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get specific work relationship
router.get('/:empId/:companyName', async (req, res) => {
  try {
    const work = await Works.get(req.params.empId, req.params.companyName);
    if (!work) {
      return res.status(404).json({ success: false, error: 'Work relationship not found' });
    }
    res.json({
      success: true,
      data: work
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create work relationship
router.post('/', async (req, res) => {
  try {
    const { emp_id, company_name, salary } = req.body;

    if (!emp_id || !company_name) {
      return res.status(400).json({
        success: false,
        error: 'Employee ID and company name are required'
      });
    }

    // Check if relationship exists
    const existing = await Works.get(emp_id, company_name);
    if (existing) {
      return res.status(400).json({
        success: false,
        error: 'Work relationship already exists'
      });
    }

    await Works.create({ emp_id, company_name, salary });
    const work = await Works.get(emp_id, company_name);

    res.status(201).json({
      success: true,
      message: 'Work relationship created successfully',
      data: work
    });
  } catch (error) {
    console.error('Error creating work relationship:', error);
    if (error.code === 'ER_NO_REFERENCED_ROW_2') {
      return res.status(400).json({
        success: false,
        error: 'Invalid employee ID or company name'
      });
    }
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update work relationship (salary)
router.put('/:empId/:companyName', async (req, res) => {
  try {
    const { salary } = req.body;
    const { empId, companyName } = req.params;

    if (salary === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Salary is required'
      });
    }

    const affectedRows = await Works.update(empId, companyName, salary);
    if (affectedRows === 0) {
      return res.status(404).json({ success: false, error: 'Work relationship not found' });
    }

    const work = await Works.get(empId, companyName);
    res.json({
      success: true,
      message: 'Salary updated successfully',
      data: work
    });
  } catch (error) {
    console.error('Error updating work relationship:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Delete work relationship
router.delete('/:empId/:companyName', async (req, res) => {
  try {
    const affectedRows = await Works.delete(req.params.empId, req.params.companyName);
    if (affectedRows === 0) {
      return res.status(404).json({ success: false, error: 'Work relationship not found' });
    }
    res.json({
      success: true,
      message: 'Work relationship deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting work relationship:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
