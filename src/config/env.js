require('dotenv').config();
const Joi = require('joi');

const envSchema = Joi.object({
  MONGO_URI: Joi.string().required(),
  MONGO_URI_TEST: Joi.string().optional(),
  WORKER_API_KEY: Joi.string().required(),
  PORT: Joi.number().default(3000),
  REAPER_ENABLED: Joi.boolean().default(true),
  REAPER_INTERVAL_MS: Joi.number().default(60000),
  LOG_LEVEL: Joi.string().valid('error', 'warn', 'info', 'debug').default('info'),
  FRONTEND_ORIGIN: Joi.string().optional(),
  NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
  JWT_SECRET: Joi.string().optional(),
  QUEUE_LEASE_SECONDS: Joi.number().default(30)
}).unknown();

const { error, value } = envSchema.validate(process.env);
if (error) throw new Error(`Environment validation error: ${error.message}`);

module.exports = {
  port: value.PORT,
  nodeEnv: value.NODE_ENV,
  mongoUri: value.NODE_ENV === 'test' ? value.MONGO_URI_TEST || value.MONGO_URI : value.MONGO_URI,
  workerApiKey: value.WORKER_API_KEY,
  reaperEnabled: value.REAPER_ENABLED,
  reaperIntervalMs: value.REAPER_INTERVAL_MS,
  logLevel: value.LOG_LEVEL,
  frontendOrigin: value.FRONTEND_ORIGIN,
  jwtSecret: value.JWT_SECRET,
  queueLeaseSeconds: value.QUEUE_LEASE_SECONDS
};
