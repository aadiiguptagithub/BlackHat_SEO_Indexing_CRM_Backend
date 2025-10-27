const mongoose = require('mongoose');
const config = require('./env');

if (!config.mongoUri) throw new Error('MONGO_URI required');

const connectDB = async () => {
  await mongoose.connect(config.mongoUri, {
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000
  });
  console.log('MongoDB connected');
};

const disconnectDB = async () => {
  await mongoose.disconnect();
  console.log('MongoDB disconnected');
};

mongoose.connection.on('error', err => console.error('MongoDB error:', err));

module.exports = { connectDB, disconnectDB };
