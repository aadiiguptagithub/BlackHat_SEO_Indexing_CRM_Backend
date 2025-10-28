const Job = require('../../models/Job');
const Website = require('../../models/Website');
const Submission = require('../../models/Submission');
const workerTrigger = require('./worker-trigger.service');

const createJob = async (input) => {
  const job = await Job.create(input);
  const websites = await Website.find({ _id: { $in: input.websiteIds } });
  
  const submissions = websites.map(website => ({
    jobId: job._id,
    websiteId: website._id,
    status: 'pending'
  }));
  
  await Submission.insertMany(submissions);
  await Job.updateCounts(job._id);
  
  // Trigger worker if configured
  console.log(`Job created with ${submissions.length} submissions. Attempting to trigger worker...`);
  const triggerResult = await workerTrigger.smartTrigger();
  console.log('Worker trigger result:', triggerResult);
  
  return job;
};

const getJob = async (id) => {
  const job = await Job.findById(id);
  if (!job) return null;
  
  const total = job.counts.pending + job.counts.running + job.counts.success + job.counts.failed;
  const progress = total > 0 ? Math.round(((job.counts.success + job.counts.failed) / total) * 100) : 0;
  
  return { ...job.toObject(), progress };
};

const listJobs = async ({ page = 1, limit = 10 }) => {
  const skip = (page - 1) * limit;
  const [data, total] = await Promise.all([
    Job.find().skip(skip).limit(limit).sort({ createdAt: -1 }),
    Job.countDocuments()
  ]);
  
  return { data, total, page, limit };
};

const retryFailed = async (jobId, limit) => {
  const query = { jobId, status: 'failed' };
  if (limit) query.limit = limit;
  
  const result = await Submission.updateMany(
    query,
    { $set: { status: 'pending' }, $inc: { attempt: 1 } }
  );
  
  await Job.updateCounts(jobId);
  
  // Trigger worker for retry
  if (result.modifiedCount > 0) {
    console.log(`Retrying ${result.modifiedCount} failed submissions. Triggering worker...`);
    const triggerResult = await workerTrigger.smartTrigger();
    console.log('Worker trigger result:', triggerResult);
  }
  
  return result.modifiedCount;
};

const cancelJob = async (jobId) => {
  await Job.findByIdAndUpdate(jobId, { status: 'cancelled' });
  await Submission.updateMany({ jobId, status: { $in: ['pending', 'running'] } }, { status: 'cancelled' });
  await Job.updateCounts(jobId);
};

const recomputeCounts = async (jobId) => {
  const mongoose = require('mongoose');
  const counts = await Submission.aggregate([
    { $match: { jobId: new mongoose.Types.ObjectId(jobId) } },
    { $group: { _id: '$status', count: { $sum: 1 } } }
  ]);
  
  const countsObj = { pending: 0, running: 0, success: 0, failed: 0 };
  counts.forEach(c => countsObj[c._id] = c.count);
  
  return await Job.findByIdAndUpdate(jobId, { $set: { counts: countsObj } }, { new: true });
};

const deleteJob = async (jobId) => {
  await Submission.deleteMany({ jobId });
  await Job.findByIdAndDelete(jobId);
};

module.exports = { createJob, getJob, listJobs, retryFailed, cancelJob, recomputeCounts, deleteJob };