const express = require('express');
const router = express.Router();
const Dependent = require('../models/Dependent');
const { body, validationResult } = require('express-validator');

// Validation middleware
const validateDependent = [
  body('Employee_Id').notEmpty().isInt().withMessage('Valid Employee ID is required'),
  body('D_name').notEmpty().withMessage('Dependent name is required'),
  body('Gender').isIn(['Male', 'Female', 'Other']).withMessage('Invalid gender'),
  body('Relationship').notEmpty().withMessage('Relationship is required')
];

// Get all dependents
router.get('/', async (req, res) => {
  try {
    const dependents = await Dependent.getAll();
    res.json({
      success: true,
      count: dependents.length,
      data: dependents
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get dependent by ID
router.get('/:id', async (req, res) => {
  try {
    const dependent = await Dependent.getById(req.params.id);
    if (!dependent) {
      return res.status(404).json({ success: false, error: 'Dependent not found' });
    }
    res.json({
      success: true,
      data: dependent
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create new dependent
router.post('/', validateDependent, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const dependentId = await Dependent.create(req.body);
    const dependent = await Dependent.getById(dependentId);
    res.status(201).json({
      success: true,
      message: 'Dependent created successfully',
      data: dependent
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update dependent
router.put('/:id', validateDependent, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const affectedRows = await Dependent.update(req.params.id, req.body);
    if (affectedRows === 0) {
      return res.status(404).json({ success: false, error: 'Dependent not found' });
    }
    const dependent = await Dependent.getById(req.params.id);
    res.json({
      success: true,
      message: 'Dependent updated successfully',
      data: dependent
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Delete dependent
router.delete('/:id', async (req, res) => {
  try {
    const affectedRows = await Dependent.delete(req.params.id);
    if (affectedRows === 0) {
      return res.status(404).json({ success: false, error: 'Dependent not found' });
    }
    res.json({
      success: true,
      message: 'Dependent deleted successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
