const express = require('express');
const router = express.Router();

const authRoutes = require('./features/auth/auth.routes');
const websiteRoutes = require('./features/websites/website.routes');
const jobRoutes = require('./features/jobs/job.routes');
const { submissionRouter } = require('./features/submissions/submission.routes');
const metricsRoutes = require('./features/metrics/metrics.routes');
const healthRoutes = require('./health/route');

router.use('/auth', authRoutes);
router.use('/websites', websiteRoutes);
router.use('/jobs', jobRoutes);
router.use('/submissions', submissionRouter);
router.use('/metrics', metricsRoutes);
router.use('/health', healthRoutes);

router.get('/', (req, res) => {
  res.json({
    name: 'Black Hat SEO API',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      websites: '/api/websites',
      jobs: '/api/jobs',
      submissions: '/api/submissions',
      metrics: '/api/metrics',
      health: '/api/health'
    }
  });
});

module.exports = router;
