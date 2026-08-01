const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const connURI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/ai_support_assistant';
    const conn = await mongoose.connect(connURI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Database Connection Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
