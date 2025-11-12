const { Event } = require("../models/Event");
const { Booking } = require("../models/Booking");
const { Ticket } = require("../models/Ticket");
const { generateTickets } = require("../utils/ticketGenerator");

/* -------------------------------------------------------------------------- */
/*                               BOOKING TICKETS                              */
/* -------------------------------------------------------------------------- */

// POST /events/:id/book
exports.bookEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      req.flash("error", "ไม่พบอีเวนต์");
      return res.redirect("/");
    }

    const qty = Math.max(1, parseInt(req.body.qty || "1", 10));
    if (Number.isNaN(qty)) {
      req.flash("error", "จำนวนบัตรไม่ถูกต้อง");
      return res.redirect(`/events/${event._id}`);
    }

    if (event.tickets < qty) {
      req.flash("error", "ตั๋วไม่เพียงพอ");
      return res.redirect(`/events/${event._id}`);
    }

    // ลดจำนวนตั๋วใน event
    event.tickets -= qty;
    await event.save();

    // สร้าง booking
    const booking = await Booking.create({
      event: event._id,
      user: req.session.user._id,
      qty,
      total: (event.price || 0) * qty,
      status: "paid",
    });

    // สร้าง E-ticket
    await generateTickets(booking);

    req.flash("success", "จองตั๋วสำเร็จ! E-Ticket ถูกสร้างเรียบร้อยแล้ว");
    res.redirect("/me/bookings");
  } catch (err) {
    console.error(err);
    req.flash("error", "เกิดข้อผิดพลาดในการจองตั๋ว");
    res.redirect("/");
  }
};

/* -------------------------------------------------------------------------- */
/*                            VIEW ALL MY BOOKINGS                            */
/* -------------------------------------------------------------------------- */

// GET /me/bookings
exports.getMyBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ user: req.session.user._id })
      .populate("event")
      .sort({ createdAt: -1 })
      .lean();

    res.render("attendee/bookings", { bookings });
  } catch (err) {
    console.error(err);
    req.flash("error", "ไม่สามารถดึงข้อมูลการจองได้");
    res.redirect("/");
  }
};

/* -------------------------------------------------------------------------- */
/*                           VIEW SINGLE BOOKING DETAIL                        */
/* -------------------------------------------------------------------------- */

// GET /me/bookings/:id
exports.getBookingDetail = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id).populate("event").lean();
    if (!booking) {
      req.flash("error", "ไม่พบการจอง");
      return res.redirect("/me/bookings");
    }

    // ✅ ตรวจสอบว่า user เป็นเจ้าของ booking
    if (booking.user.toString() !== req.session.user._id.toString()) {
      req.flash("error", "คุณไม่สามารถเข้าถึงบัตรนี้ได้");
      return res.redirect("/me/bookings");
    }

    const tickets = await Ticket.find({ booking: booking._id }).lean();

    res.render("attendee/bookingDetail", { booking, tickets });
  } catch (err) {
    console.error(err);
    req.flash("error", "เกิดข้อผิดพลาด");
    res.redirect("/me/bookings");
  }
};
