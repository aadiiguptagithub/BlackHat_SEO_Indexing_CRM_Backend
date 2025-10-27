const config = require('../config/env');
const { AsyncLocalStorage } = require('async_hooks');

const asyncLocalStorage = new AsyncLocalStorage();

const levels = { error: 0, warn: 1, info: 2, debug: 3 };
const currentLevel = levels[config.logLevel] || levels.info;

const log = (level, message, meta = {}) => {
  if (levels[level] <= currentLevel) {
    const store = asyncLocalStorage.getStore();
    const requestId = store?.requestId;
    const logData = { timestamp: new Date().toISOString(), level, message, ...meta };
    if (requestId) logData.requestId = requestId;
    console.log(JSON.stringify(logData));
  }
};

const withRequestId = (requestId, fn) => {
  return asyncLocalStorage.run({ requestId }, fn);
};

module.exports = {
  error: (msg, meta) => log('error', msg, meta),
  warn: (msg, meta) => log('warn', msg, meta),
  info: (msg, meta) => log('info', msg, meta),
  debug: (msg, meta) => log('debug', msg, meta),
  withRequestId
};
