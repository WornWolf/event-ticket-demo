const mongoose = require('mongoose');
const { Schema } = mongoose;

const BookingSchema = new Schema({
  event:  { type: Schema.Types.ObjectId, ref: 'Event', required: true },
  user:   { type: Schema.Types.ObjectId, ref: 'User', required: true },
  qty:    { type: Number, min: 1, default: 1 },
  total:  { type: Number, min: 0, default: 0 },
  status: { type: String, enum: ['pending', 'paid', 'cancelled'], default: 'pending' },

  // เพิ่มสำหรับ E-Ticket
  qrToken:       { type: String, index: true }, // โทเคนเฉพาะสำหรับตรวจบัตร
  qrCodeDataUrl: { type: String },              // Data URL PNG ของ QR (เก็บไว้แสดง/ดาวน์โหลด)
  checkedInAt:   { type: Date }                 // (ออปชัน) เวลาที่เช็คอินแล้ว
}, { timestamps: true });

module.exports = { Booking: mongoose.model('Booking', BookingSchema) };
