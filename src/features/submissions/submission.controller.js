const Joi = require('joi');
const { success, error, paginated } = require('../../utils/http');
const { paginationSchema } = require('../../utils/validators');
const submissionService = require('./submission.service');
const Submission = require('../../models/Submission');

const reportSchema = Joi.object({
  status: Joi.string().valid('success', 'failed').required(),
  logs: Joi.array().items(Joi.string()).default([]),
  evidence: Joi.object({
    screenshotPath: Joi.string().allow('').optional(),
    htmlPath: Joi.string().allow('').optional()
  }).default({}),
  error: Joi.string().allow('').optional()
});

const claim = async (req, res, next) => {
  try {
    const leaseSeconds = parseInt(req.query.lease) || 30;
    const submission = await submissionService.claimNextSubmission(leaseSeconds);
    
    if (!submission) {
      return success(res, null, 'No submissions available');
    }
    
    success(res, submission);
  } catch (err) {
    next(err);
  }
};

const report = async (req, res, next) => {
  try {
    const { error: validationError, value } = reportSchema.validate(req.body);
    if (validationError) return error(res, validationError.details[0].message, 400);
    
    const submission = await submissionService.reportResult(req.params.id, value);
    if (!submission) return error(res, 'Submission not found', 404);
    
    success(res, submission);
  } catch (err) {
    next(err);
  }
};

const listByJob = async (req, res, next) => {
  try {
    const { error: validationError, value } = paginationSchema.validate(req.query);
    if (validationError) return error(res, validationError.details[0].message, 400);
    
    const result = await submissionService.listByJob(req.params.id, { ...value, status: req.query.status });
    paginated(res, result.data, { page: result.page, limit: result.limit, total: result.total });
  } catch (err) {
    next(err);
  }
};

const exportCsv = async (req, res, next) => {
  try {
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="job-${req.params.id}-submissions.csv"`);
    
    res.write('url,status,attempts,lastError,evidencePaths,updatedAt\n');
    
    const cursor = Submission.find({ jobId: req.params.id })
      .populate('websiteId', 'url')
      .lean()
      .cursor();
    
    for (let doc = await cursor.next(); doc != null; doc = await cursor.next()) {
      const evidencePaths = [];
      if (doc.evidence?.screenshotPath) evidencePaths.push(doc.evidence.screenshotPath);
      if (doc.evidence?.htmlPath) evidencePaths.push(doc.evidence.htmlPath);
      
      const row = [
        doc.websiteId?.url || '',
        doc.status,
        doc.attempt,
        doc.lastError || '',
        evidencePaths.join(';'),
        doc.updatedAt?.toISOString() || ''
      ].map(field => `"${String(field).replace(/"/g, '""')}"`).join(',');
      
      res.write(row + '\n');
    }
    
    res.end();
  } catch (err) {
    next(err);
  }
};

const deleteSubmission = async (req, res, next) => {
  try {
    const submission = await Submission.findByIdAndDelete(req.params.id);
    if (!submission) return error(res, 'Submission not found', 404);
    
    const deltas = {};
    deltas[`counts.${submission.status}`] = -1;
    await require('../../models/Job').findByIdAndUpdate(submission.jobId, { $inc: deltas });
    
    success(res, null, 'Submission deleted');
  } catch (err) {
    next(err);
  }
};

module.exports = { claim, report, listByJob, exportCsv, deleteSubmission };