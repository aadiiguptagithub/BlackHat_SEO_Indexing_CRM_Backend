const express = require('express');
const { getMetrics } = require('./metrics.controller');

const router = express.Router();

router.get('/', getMetrics);

module.exports = router;