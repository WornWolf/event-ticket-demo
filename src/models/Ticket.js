const mongoose = require("mongoose");
const { Schema } = mongoose;

const TicketSchema = new Schema(
  {
    booking: { type: Schema.Types.ObjectId, ref: "Booking", required: true },
    event: { type: Schema.Types.ObjectId, ref: "Event", required: true },
    owner: { type: Schema.Types.ObjectId, ref: "User", required: true },

    ticketCode: { type: String, unique: true, required: true, index: true },
    qrToken: { type: String, unique: true, index: true },
    qrCodeDataUrl: { type: String },

    status: {
      type: String,
      enum: ["valid", "used", "cancelled"],
      default: "valid",
    },
    checkedInAt: { type: Date },
  },
  { timestamps: true }
);

module.exports = { Ticket: mongoose.model("Ticket", TicketSchema) };
