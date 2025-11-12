const mongoose = require('mongoose');

function connectDB() {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/event_ticketing_dev';
  mongoose.connect(uri, { })
    .then(() => console.log('✅ MongoDB connected'))
    .catch(err => {
      console.error('MongoDB error:', err.message);
      process.exit(1);
    });
}

module.exports = { connectDB };
