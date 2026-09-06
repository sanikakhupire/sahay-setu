const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

router.get('/', (req, res) => {
  const dbState = mongoose.connection.readyState;
  const dbStatus = ['disconnected', 'connected', 'connecting', 'disconnecting'][dbState];

  res.status(200).json({
    success: true,
    message: 'Sahay Setu API is running',
    database: dbStatus,
    timestamp: new Date().toISOString(),
  });
});

module.exports = router;