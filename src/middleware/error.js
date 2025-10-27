const config = require('../config/env');

const errorHandler = (err, req, res, next) => {
  if (config.nodeEnv !== 'production') {
    console.error(err.stack);
  }

  let message = err.message;
  let errors;

  if (err.name === 'ValidationError') {
    message = 'Validation Error';
    errors = Object.values(err.errors).map(e => e.message);
  } else if (err.code === 11000) {
    message = 'Duplicate key error';
  } else if (err.name === 'CastError') {
    message = 'Invalid ID format';
  }

  const response = { success: false, message };
  if (errors) response.errors = errors;

  res.status(err.statusCode || 500).json(response);
};

const notFound = (req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
};

module.exports = { errorHandler, notFound };
