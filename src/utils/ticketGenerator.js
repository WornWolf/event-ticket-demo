require("dotenv").config();
const { Ticket } = require("../models/Ticket");
const QRCode = require("qrcode");
const crypto = require("crypto");

// รับ BASE_URL จาก .env หรือ fallback เป็น localhost
const BASE_URL = process.env.BASE_URL ;

async function generateTickets(booking) {
  const tickets = [];

  for (let i = 0; i < booking.qty; i++) {
    const qrToken = crypto.randomUUID();
    const ticketCode = `${booking._id.toString().slice(-6)}-${i + 1}`;
    const qrData = `${BASE_URL}/ticket/verify?b=${booking._id}&t=${qrToken}`;
    const qrCodeDataUrl = await QRCode.toDataURL(qrData, {
      errorCorrectionLevel: "M",
      margin: 1,
      scale: 6,
    });

    tickets.push({
      booking: booking._id,
      event: booking.event,
      owner: booking.user,
      ticketCode,
      qrToken,
      qrCodeDataUrl,
    });
  }

  await Ticket.insertMany(tickets);
  return tickets;
}

module.exports = { generateTickets };
