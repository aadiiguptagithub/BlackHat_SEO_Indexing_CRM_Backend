const config = require('./config/env');
const { connectDB, disconnectDB } = require('./config/db');
const createApp = require('./app');
const { runReaper } = require('./cron/reaper');

const start = async () => {
  await connectDB();
  const app = createApp();
  const server = app.listen(config.port, () => {
    console.log(`Health: http://localhost:${config.port}/health`);
  });

  // Start reaper if enabled
  let reaperInterval;
  if (process.env.REAPER_ENABLED === 'true') {
    const intervalMs = (process.env.REAPER_INTERVAL_SECONDS || 60) * 1000;
    reaperInterval = setInterval(runReaper, intervalMs);
  }

  const shutdown = () => {
    if (reaperInterval) clearInterval(reaperInterval);
    server.close(async () => {
      await disconnectDB();
      process.exit(0);
    });
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
};

start();
