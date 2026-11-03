const mongoose = require('mongoose');

const connectDB = async () => {
  const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/moodsync';
  try {
    mongoose.set('strictQuery', true);
    await mongoose.connect(uri, {});
    console.log(`[MongoDB] Connected: ${mongoose.connection.host}`);
  } catch (err) {
    console.error(`[MongoDB] Connection error: ${err.message}`);
    console.error('The API will keep running, but any DB-dependent route will fail until MongoDB is reachable.');
  }

  mongoose.connection.on('disconnected', () => {
    console.warn('[MongoDB] Disconnected');
  });
};

module.exports = connectDB;
