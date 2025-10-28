const { success, error } = require('../../utils/http');
const workerTrigger = require('./worker-trigger.service');

const triggerWorker = async (req, res, next) => {
  try {
    const result = await workerTrigger.smartTrigger();
    
    if (result.triggered) {
      success(res, result, 'Worker triggered successfully');
    } else {
      success(res, result, `Worker not triggered: ${result.reason || 'unknown'}`);
    }
  } catch (err) {
    next(err);
  }
};

const checkStatus = async (req, res, next) => {
  try {
    const configured = workerTrigger.isConfigured();
    const hasTasks = await workerTrigger.hasPendingTasks();
    
    success(res, {
      configured,
      enabled: process.env.WORKER_TRIGGER_ENABLED === 'true',
      hasPendingTasks: hasTasks,
      railwayConfigured: !!(process.env.RAILWAY_API_TOKEN && process.env.RAILWAY_SERVICE_ID)
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { triggerWorker, checkStatus };
