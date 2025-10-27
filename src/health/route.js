const express = require('express');
const mongoose = require('mongoose');

const router = express.Router();

router.get('/ready', async (req, res) => {
  const start = Date.now();
  
  try {
    await mongoose.connection.db.admin().ping();
    
    const collections = await mongoose.connection.db.listCollections().toArray();
    const hasIndexes = collections.length > 0;
    
    res.json({
      ok: true,
      db: true,
      indexes: hasIndexes,
      time: Date.now() - start
    });
  } catch (error) {
    res.status(503).json({
      ok: false,
      db: false,
      indexes: false,
      time: Date.now() - start
    });
  }
});

module.exports = router;