const rateLimit = require('express-rate-limit');

const publicLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false
});

const workerLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 600,
  keyGenerator: (req) => req.headers['x-api-key'] || req.ip,
  standardHeaders: true,
  legacyHeaders: false
});

const attachPublicRateLimit = (app) => {
  app.use(publicLimiter);
};

const attachWorkerRateLimit = (router) => {
  router.use(workerLimiter);
};

module.exports = { attachPublicRateLimit, attachWorkerRateLimit };