const mongoose = require('mongoose');

const EventSchema = new mongoose.Schema({
  title: { type: String, required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  description: { type: String },
  location: { type: String },
  price: { type: Number, default: 0 },
  tickets: { type: Number, default: 0 },
  lockStart: { type: Boolean, default: false },
  imageUrl: { type: String },
  cloudinary_id: { type: String },
  organizer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, {
  timestamps: true
});

const Event = mongoose.model('Event', EventSchema);
module.exports = { Event };
