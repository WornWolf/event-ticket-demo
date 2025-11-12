const express = require("express");
const router = express.Router();
const { isAuthenticated } = require("../middleware/auth");
const bookingController = require("../controllers/bookingController");

// POST: จองตั๋วงาน
router.post("/events/:id/book", isAuthenticated, bookingController.bookEvent);

// GET: ดูรายการจองทั้งหมดของตัวเอง
router.get("/me/bookings", isAuthenticated, bookingController.getMyBookings);

// GET: ดูรายละเอียดการจองแต่ละอัน
router.get("/me/bookings/:id", isAuthenticated, bookingController.getBookingDetail);

module.exports = router;
