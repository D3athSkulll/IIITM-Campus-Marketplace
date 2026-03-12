const mongoose = require('mongoose');

const connectDB = async () => {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    console.error('MongoDB connection error: MONGODB_URI is missing in server/.env');
    process.exit(1);
  }

  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 10000,
    });
    console.log(`MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`MongoDB connection error: ${error.message}`);

    if (uri.includes('mongodb+srv://')) {
      console.error('Fix checklist for MongoDB Atlas:');
      console.error('1) Atlas -> Network Access: add your current public IP (or 0.0.0.0/0 for quick dev test).');
      console.error('2) Atlas -> Database Access: verify username/password and role permissions.');
      console.error('3) Atlas cluster must be running and reachable from your network.');
      console.error('4) Ensure MONGODB_URI includes a database name path, e.g. /campus-marketplace.');
    }

    process.exit(1);
  }
};

module.exports = connectDB;
