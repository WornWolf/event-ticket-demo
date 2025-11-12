// src/models/PendingUser.js
const mongoose = require("mongoose");

const pendingUserSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  passwordHash: String,
  otp: String,
  otpExpires: Date,
  createdAt: { type: Date, default: Date.now },
});

module.exports.PendingUser = mongoose.model("PendingUser", pendingUserSchema);
