const express = require('express');
const router = express.Router();
const { bulkUpload, list, remove } = require('./website.controller');

router.post('/bulk', bulkUpload);
router.get('/', list);
router.delete('/:id', remove);

module.exports = router;