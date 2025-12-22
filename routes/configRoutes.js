const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.json({
    companyName: process.env.COMPANY_NAME || 'Company Management System'
  });
});

module.exports = router;