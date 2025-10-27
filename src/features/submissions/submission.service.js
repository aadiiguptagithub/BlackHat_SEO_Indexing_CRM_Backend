const Submission = require('../../models/Submission');
const Job = require('../../models/Job');
const { renewLease } = require('../../libs/queue');

const claimNext = async (leaseSeconds) => {
  const leaseUntil = new Date(Date.now() + leaseSeconds * 1000);
  
  return await Submission.findOneAndUpdate(
    {
      $or: [
        { status: 'pending' },
        { status: 'running', leaseUntil: { $lt: new Date() } }
      ]
    },
    { status: 'running', leaseUntil },
    { 
      new: true,
      sort: { createdAt: 1 }
    }
  )
  .populate('websiteId', 'url')
  .populate('jobId', 'fields messageTemplate');
};

const claimNextSubmission = async (leaseSeconds) => {
  return await claimNext(leaseSeconds);
};

const reportResult = async (id, { status, logs, evidence, error }) => {
  const original = await Submission.findById(id);
  if (!original) return null;
  
  if (['success', 'failed', 'cancelled'].includes(original.status)) {
    return original;
  }
  
  const update = { status };
  if (logs) update.$push = { logs: { $each: logs } };
  if (error) update.lastError = error;
  
  if (status === 'success') {
    update.finishedAt = new Date();
    update.$unset = { leaseUntil: 1 };
  }
  
  if (evidence) {
    const merged = { ...original.evidence };
    if (evidence.screenshotPath && !merged.screenshotPath) merged.screenshotPath = evidence.screenshotPath;
    if (evidence.htmlPath && !merged.htmlPath) merged.htmlPath = evidence.htmlPath;
    update.evidence = merged;
  }
  
  const submission = await Submission.findByIdAndUpdate(id, update, { new: true });
  
  if (submission && original.status !== status) {
    const deltas = {};
    deltas[`counts.${original.status}`] = -1;
    deltas[`counts.${status}`] = 1;
    await Job.findByIdAndUpdate(submission.jobId, { $inc: deltas });
  }
  
  return submission;
};

const renewSubmissionLease = async (id, seconds) => {
  return await renewLease(id, seconds);
};

const statsByJob = async (jobId) => {
  const mongoose = require('mongoose');
  const stats = await Submission.aggregate([
    { $match: { jobId: new mongoose.Types.ObjectId(jobId) } },
    { $group: { _id: '$status', count: { $sum: 1 } } }
  ]);
  
  const result = { pending: 0, running: 0, success: 0, failed: 0, cancelled: 0 };
  stats.forEach(s => result[s._id] = s.count);
  
  return result;
};

const listByJob = async (jobId, { page = 1, limit = 10, status }) => {
  const mongoose = require('mongoose');
  const query = { jobId: new mongoose.Types.ObjectId(jobId) };
  if (status) query.status = status;
  
  const skip = (page - 1) * limit;
  const [data, total] = await Promise.all([
    Submission.find(query).populate('websiteId', 'url').skip(skip).limit(limit),
    Submission.countDocuments(query)
  ]);
  
  return { data, total, page, limit };
};

module.exports = { claimNextSubmission, reportResult, renewSubmissionLease, statsByJob, listByJob };