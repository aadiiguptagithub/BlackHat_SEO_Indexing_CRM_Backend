const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');
const morgan = require('morgan');

const config = require('./config/env');
const routes = require('./routes');
const { notFound, errorHandler } = require('./middleware/error');

const createApp = () => {
  const app = express();

  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'"]
      }
    },
    referrerPolicy: { policy: "strict-origin-when-cross-origin" }
  }));
  
  const corsOrigin = config.nodeEnv === 'development' 
    ? (process.env.FRONTEND_ORIGIN || '*')
    : process.env.FRONTEND_ORIGIN;
    
  app.use(cors({ origin: corsOrigin }));
  app.use(compression());
  app.use(morgan('combined'));
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  app.get('/health', (req, res) => {
    res.json({ ok: true, env: config.nodeEnv, time: Date.now() });
  });

  app.use('/api', routes);
  app.use(notFound);
  app.use(errorHandler);

  return app;
};

module.exports = createApp;
