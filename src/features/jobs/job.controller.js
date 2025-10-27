const { createJobSchema, paginationSchema } = require('../../utils/validators');
const { success, error, paginated } = require('../../utils/http');
const jobService = require('./job.service');
const submissionService = require('../submissions/submission.service');
const Submission = require('../../models/Submission');

const create = async (req, res, next) => {
  try {
    const { error: validationError, value } = createJobSchema.validate(req.body);
    if (validationError) return error(res, validationError.details[0].message, 400);
    
    const job = await jobService.createJob(value);
    success(res, job, 'Job created', 201);
  } catch (err) {
    next(err);
  }
};

const getOne = async (req, res, next) => {
  try {
    const job = await jobService.getJob(req.params.id);
    if (!job) return error(res, 'Job not found', 404);
    
    success(res, job);
  } catch (err) {
    next(err);
  }
};

const list = async (req, res, next) => {
  try {
    const { error: validationError, value } = paginationSchema.validate(req.query);
    if (validationError) return error(res, validationError.details[0].message, 400);
    
    const result = await jobService.listJobs(value);
    paginated(res, result.data, { page: result.page, limit: result.limit, total: result.total });
  } catch (err) {
    next(err);
  }
};

const retryFailed = async (req, res, next) => {
  try {
    const count = await jobService.retryFailed(req.params.id, req.body.limit);
    success(res, { retried: count }, 'Failed submissions retried');
  } catch (err) {
    next(err);
  }
};

const cancel = async (req, res, next) => {
  try {
    await jobService.cancelJob(req.params.id);
    success(res, null, 'Job cancelled');
  } catch (err) {
    next(err);
  }
};

const exportCsv = async (req, res, next) => {
  try {
    const jobId = req.params.id;
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="job-${jobId}-submissions.csv"`);
    
    res.write('url,status,attempt,lastError,screenshotPath,htmlPath,updatedAt\n');
    
    const cursor = Submission.find({ jobId }).populate('websiteId', 'url').lean().cursor();
    let count = 0;
    
    cursor.on('data', (doc) => {
      const row = [
        doc.websiteId?.url || '',
        doc.status,
        doc.attempt,
        (doc.lastError || '').replace(/"/g, '""'),
        doc.evidence?.screenshotPath || '',
        doc.evidence?.htmlPath || '',
        doc.updatedAt?.toISOString() || ''
      ].map(field => `"${field}"`).join(',');
      
      if (!res.write(row + '\n')) {
        cursor.pause();
        res.once('drain', () => cursor.resume());
      }
      
      if (++count % 100 === 0) {
        cursor.pause();
        setImmediate(() => cursor.resume());
      }
    });
    
    cursor.on('end', () => res.end());
    cursor.on('error', (err) => {
      cursor.close();
      next(err);
    });
    
    req.on('close', () => cursor.close());
  } catch (err) {
    next(err);
  }
};

const recomputeCounts = async (req, res, next) => {
  try {
    const job = await jobService.recomputeCounts(req.params.id);
    if (!job) return error(res, 'Job not found', 404);
    
    success(res, job.counts, 'Counts recomputed');
  } catch (err) {
    next(err);
  }
};

const getJobSubmissions = async (req, res, next) => {
  try {
    const { error: validationError, value } = paginationSchema.validate(req.query);
    if (validationError) return error(res, validationError.details[0].message, 400);
    
    const result = await submissionService.listByJob(req.params.id, { ...value, status: req.query.status });
    paginated(res, result.data, { page: result.page, limit: result.limit, total: result.total });
  } catch (err) {
    next(err);
  }
};

const deleteJob = async (req, res, next) => {
  try {
    await jobService.deleteJob(req.params.id);
    success(res, null, 'Job deleted');
  } catch (err) {
    next(err);
  }
};

module.exports = { create, getOne, list, getJobSubmissions, retryFailed, cancel, exportCsv, recomputeCounts, deleteJob };