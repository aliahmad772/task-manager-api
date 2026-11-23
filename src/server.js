import 'dotenv/config';
import mongoose from 'mongoose';
import app from './app.js';

const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/auth_db';

/**
 * Connect to MongoDB and start HTTP server
 */
const startServer = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log(' Successfully connected to MongoDB');

    app.listen(PORT, () => {
      console.log(` Server is running on port ${PORT}`);
      console.log(` Base URL: http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error(' MongoDB connection failed:', error.message);
    process.exit(1);
  }
};

startServer();
