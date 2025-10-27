const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
  name: { type: String, required: true },
  messageTemplate: { type: String, required: true },
  fields: mongoose.Schema.Types.Mixed,
  status: { 
    type: String, 
    enum: ['draft', 'queued', 'running', 'completed', 'failed', 'cancelled'],
    default: 'draft'
  },
  counts: {
    pending: { type: Number, default: 0 },
    running: { type: Number, default: 0 },
    success: { type: Number, default: 0 },
    failed: { type: Number, default: 0 }
  },
  createdBy: String,
  createdAt: { type: Date, default: Date.now }
});

jobSchema.index({ status: 1 });
jobSchema.index({ createdAt: 1 });

jobSchema.statics.updateCounts = async function(jobId) {
  const Submission = require('./Submission');
  const counts = await Submission.aggregate([
    { $match: { jobId: new mongoose.Types.ObjectId(jobId) } },
    { $group: { _id: '$status', count: { $sum: 1 } } }
  ]);
  
  const countsObj = { pending: 0, running: 0, success: 0, failed: 0 };
  counts.forEach(c => countsObj[c._id] = c.count);
  
  return this.findByIdAndUpdate(jobId, { counts: countsObj });
};

module.exports = mongoose.model('Job', jobSchema);