const express = require('express');
const router = express.Router();
const { bulkUpload, list, remove, toggleStatus } = require('./website.controller');

router.post('/bulk', bulkUpload);
router.get('/', list);
router.patch('/:id/toggle-status', toggleStatus);
router.delete('/:id', remove);

module.exports = router;