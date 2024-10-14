// config/database.js
const mongoose = require('mongoose');

const QUERY_TIMEOUT = 1147483647;
const POOL_SIZE = 5;

const connectDB = async () => {
  try {
    await mongoose.connect('mongodb://admin:mypass@localhost/moviedb?authSource=admin', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: QUERY_TIMEOUT,
      socketTimeoutMS: QUERY_TIMEOUT,
      maxPoolSize: POOL_SIZE,
    });
    console.log('MongoDB connected successfully.');
  } catch (error) {
    console.error('MongoDB connection error:', error.message);
    process.exit(1);
  }
};

module.exports = connectDB;
