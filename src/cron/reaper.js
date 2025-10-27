const Submission = require('../models/Submission');
const logger = require('../libs/logger');

const MAX_ATTEMPTS = parseInt(process.env.MAX_ATTEMPTS) || 3;
const BATCH_SIZE = 200;

const processSubmission = async (submission) => {
  const update = { attempt: submission.attempt + 1 };
  
  if (submission.attempt + 1 >= MAX_ATTEMPTS) {
    update.status = 'failed';
    update.lastError = 'max attempts reached';
  } else {
    update.status = 'pending';
    update.$push = { logs: 'requeued by reaper' };
  }
  
  update.$unset = { leaseUntil: 1 };
  
  await Submission.findByIdAndUpdate(submission._id, update);
  return update.status;
};

const runReaper = async () => {
  const stuckSubmissions = await Submission.find({
    status: 'running',
    leaseUntil: { $lt: new Date() }
  }).limit(BATCH_SIZE);
  
  if (stuckSubmissions.length === 0) return;
  
  const results = await Promise.allSettled(
    stuckSubmissions.map(processSubmission)
  );
  
  const counts = { requeued: 0, failed: 0, errors: 0 };
  results.forEach((result, i) => {
    if (result.status === 'fulfilled') {
      counts[result.value === 'failed' ? 'failed' : 'requeued']++;
    } else {
      counts.errors++;
      logger.error('Reaper processing error', { submissionId: stuckSubmissions[i]._id, error: result.reason });
    }
  });
  
  logger.info('Reaper completed', counts);
};

let reaperInterval;

const scheduleReaper = (intervalMs = 60000) => {
  if (reaperInterval) clearInterval(reaperInterval);
  reaperInterval = setInterval(runReaper, intervalMs);
  logger.info('Reaper scheduled', { intervalMs });
};

module.exports = { runReaper, scheduleReaper };