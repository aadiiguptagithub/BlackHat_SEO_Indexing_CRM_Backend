const Submission = require('../models/Submission');

const claimNext = async ({ leaseSeconds }) => {
  const leaseUntil = new Date(Date.now() + leaseSeconds * 1000);
  
  return await Submission.findOneAndUpdate(
    {
      $or: [
        { status: 'pending' },
        { status: 'running', leaseUntil: { $lt: new Date() } }
      ]
    },
    { status: 'running', leaseUntil },
    { new: true }
  );
};

const releaseOrFail = async (id, status, payload) => {
  return await Submission.findByIdAndUpdate(
    id,
    { status, payload, $unset: { leaseUntil: 1 } },
    { new: true }
  );
};

const renewLease = async (id, seconds) => {
  const leaseUntil = new Date(Date.now() + seconds * 1000);
  return await Submission.findByIdAndUpdate(id, { leaseUntil }, { new: true });
};

module.exports = { claimNext, releaseOrFail, renewLease };