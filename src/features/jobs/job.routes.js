const express = require('express');
const router = express.Router();
const { create, getOne, list, getJobSubmissions, retryFailed, cancel, exportCsv, recomputeCounts, deleteJob } = require('./job.controller');

router.post('/', create);
router.get('/', list);
router.get('/:id/submissions', getJobSubmissions);
router.get('/:id/export.csv', exportCsv);
router.post('/:id/retry-failed', retryFailed);
router.post('/:id/cancel', cancel);
router.post('/:id/recompute-counts', recomputeCounts);
router.delete('/:id', deleteJob);
router.get('/:id', getOne);

module.exports = router;