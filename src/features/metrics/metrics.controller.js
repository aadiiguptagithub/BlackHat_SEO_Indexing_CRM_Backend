const Submission = require('../../models/Submission');
const Job = require('../../models/Job');

const getMetrics = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [totals, todayStats, jobStats] = await Promise.all([
      Submission.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]),
      Submission.aggregate([
        { $match: { createdAt: { $gte: today } } },
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]),
      Job.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ])
    ]);

    const formatCounts = (data) => {
      const result = { pending: 0, running: 0, success: 0, failed: 0, cancelled: 0 };
      data.forEach(item => {
        if (item._id) result[item._id] = item.count;
      });
      return result;
    };

    const formatJobCounts = (data) => {
      const counts = { draft: 0, queued: 0, running: 0, completed: 0, failed: 0, cancelled: 0 };
      data.forEach(item => {
        if (item._id) counts[item._id] = item.count;
      });
      return {
        running: counts.running,
        queued: counts.queued,
        completed: counts.completed,
        failed: counts.failed
      };
    };

    res.json({
      success: true,
      data: {
        totals: formatCounts(totals),
        today: formatCounts(todayStats),
        jobs: formatJobCounts(jobStats)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch metrics',
      error: error.message
    });
  }
};

module.exports = { getMetrics };