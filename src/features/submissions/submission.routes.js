const express = require('express');
const router = express.Router();
const { protectWorker } = require('../../middleware/auth');
const { claim, report, listByJob, exportCsv, deleteSubmission } = require('./submission.controller');
const { viewEvidence } = require('./evidence.controller');

router.get('/next', protectWorker, claim);
router.patch('/:id', protectWorker, report);
router.delete('/:id', deleteSubmission);
router.get('/evidence/:jobId/:submissionId/:filename', viewEvidence);

module.exports = { submissionRouter: router };