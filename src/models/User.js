const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ['attendee', 'organizer'], default: 'attendee' },

  // profile (optional)
  firstName: { type: String, default: '' },
  lastName:  { type: String, default: '' },
  phone:     { type: String, default: '' },
  dob:       { type: Date },
  gender:    { type: String, enum: ['male','female','other',''], default: '' },
  avatarUrl: { type: String, default: ''},
  cloudinary_id: {type: String}
}, { timestamps: true });

module.exports = { User: mongoose.model('User', UserSchema) };
