const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  const base = {
    companyName: process.env.COMPANY_NAME || '26:07'
  };

  // Expose non-sensitive diagnostic flags when DEBUG_AUTH is enabled
  if (process.env.DEBUG_AUTH === 'true') {
    const required = ['DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME', 'DB_PORT', 'JWT_SECRET'];
    const missing = required.filter(k => !process.env[k]);
    base.debug = {
      debugEnabled: true,
      db: {
        allSet: missing.length === 0,
        missing
      },
      ssl: {
        enabled: (process.env.DB_SSL || 'false').toLowerCase() === 'true',
        hasCA: !!process.env.DB_CA
      }
    };
  }

  res.json(base);
});

module.exports = router;