const mongoose = require('mongoose');

const submissionSchema = new mongoose.Schema({
  jobId: { type: mongoose.Schema.Types.ObjectId, ref: 'Job', required: true },
  websiteId: { type: mongoose.Schema.Types.ObjectId, ref: 'Website', required: true },
  status: { 
    type: String, 
    enum: ['pending', 'running', 'success', 'failed', 'cancelled'],
    default: 'pending'
  },
  leaseUntil: Date,
  attempt: { type: Number, default: 0 },
  logs: [String],
  evidence: {
    screenshotPath: String,
    htmlPath: String
  },
  lastError: String,
  createdAt: { type: Date, default: Date.now }
});

submissionSchema.index({ jobId: 1, websiteId: 1 }, { unique: true });
submissionSchema.index({ status: 1 });
submissionSchema.index({ leaseUntil: 1 });

module.exports = mongoose.model('Submission', submissionSchema);