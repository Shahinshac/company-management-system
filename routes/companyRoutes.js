const express = require('express');
const router = express.Router();
const Company = require('../models/Company');

// Get all companies
router.get('/', async (req, res) => {
  try {
    const companies = await Company.getAll();
    res.json({
      success: true,
      count: companies.length,
      data: companies
    });
  } catch (error) {
    console.error('Error fetching companies:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Search companies
router.get('/search', async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) {
      return res.status(400).json({ success: false, error: 'Search term required' });
    }
    const companies = await Company.search(q);
    res.json({
      success: true,
      count: companies.length,
      data: companies
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get cities
router.get('/cities', async (req, res) => {
  try {
    const cities = await Company.getCities();
    res.json({
      success: true,
      data: cities
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get company by name
router.get('/:name', async (req, res) => {
  try {
    const company = await Company.getByName(req.params.name);
    if (!company) {
      return res.status(404).json({ success: false, error: 'Company not found' });
    }
    res.json({
      success: true,
      data: company
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get employees of a company
router.get('/:name/employees', async (req, res) => {
  try {
    const employees = await Company.getEmployees(req.params.name);
    res.json({
      success: true,
      count: employees.length,
      data: employees
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create company
router.post('/', async (req, res) => {
  try {
    const { company_name, city } = req.body;

    if (!company_name || !city) {
      return res.status(400).json({
        success: false,
        error: 'Company name and city are required'
      });
    }

    // Check if company exists
    const existing = await Company.getByName(company_name);
    if (existing) {
      return res.status(400).json({
        success: false,
        error: 'Company already exists'
      });
    }

    await Company.create({ company_name, city });
    const company = await Company.getByName(company_name);

    res.status(201).json({
      success: true,
      message: 'Company created successfully',
      data: company
    });
  } catch (error) {
    console.error('Error creating company:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update company
router.put('/:name', async (req, res) => {
  try {
    const { company_name, city } = req.body;
    const oldName = req.params.name;

    if (!company_name || !city) {
      return res.status(400).json({
        success: false,
        error: 'Company name and city are required'
      });
    }

    const affectedRows = await Company.update(oldName, { company_name, city });
    if (affectedRows === 0) {
      return res.status(404).json({ success: false, error: 'Company not found' });
    }

    const company = await Company.getByName(company_name);
    res.json({
      success: true,
      message: 'Company updated successfully',
      data: company
    });
  } catch (error) {
    console.error('Error updating company:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Delete company
router.delete('/:name', async (req, res) => {
  try {
    const affectedRows = await Company.delete(req.params.name);
    if (affectedRows === 0) {
      return res.status(404).json({ success: false, error: 'Company not found' });
    }
    res.json({
      success: true,
      message: 'Company deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting company:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
