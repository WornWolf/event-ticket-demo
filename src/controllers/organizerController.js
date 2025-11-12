// controllers/organizerController.js
const mongoose = require("mongoose");
const { Booking } = require("../models/Booking");
const { Ticket } = require("../models/Ticket");

/* -------------------------------------------------
 🧭 DASHBOARD
-------------------------------------------------- */
exports.getDashboard = async (req, res) => {
  try {
    const organizerId = new mongoose.Types.ObjectId(req.session.user._id);

    // ช่วงเวลา 30 วันล่าสุด
    const from = new Date();
    from.setHours(0, 0, 0, 0);
    from.setDate(from.getDate() - 29);

    // ---------- Summary ----------
    const summaryAgg = await Booking.aggregate([
      {
        $lookup: {
          from: "events",
          localField: "event",
          foreignField: "_id",
          as: "event",
        },
      },
      { $unwind: "$event" },
      {
        $match: {
          "event.organizer": organizerId,
          createdAt: { $gte: from },
        },
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: { $toDouble: { $ifNull: ["$total", 0] } } },
          orders: { $sum: 1 },
        },
      },
    ]);
    const summary = summaryAgg[0] || { totalRevenue: 0, orders: 0 };

    // ---------- Chart ----------
    const chartAgg = await Booking.aggregate([
      {
        $lookup: {
          from: "events",
          localField: "event",
          foreignField: "_id",
          as: "event",
        },
      },
      { $unwind: "$event" },
      {
        $match: {
          "event.organizer": organizerId,
          createdAt: { $gte: from },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: "%Y-%m-%d",
              date: "$createdAt",
              timezone: "Asia/Bangkok",
            },
          },
          total: { $sum: { $toDouble: { $ifNull: ["$total", 0] } } },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const chartLabels = chartAgg.map((d) => d._id);
    const chartValues = chartAgg.map((d) => d.total);

    // ---------- Recent bookings ----------
    const recentAgg = await Booking.aggregate([
      { $sort: { createdAt: -1 } },
      {
        $lookup: {
          from: "events",
          localField: "event",
          foreignField: "_id",
          as: "event",
        },
      },
      {
        $unwind: {
          path: "$event",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $match: {
          $or: [{ "event.organizer": organizerId }, { event: null }],
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "user",
          foreignField: "_id",
          as: "user",
        },
      },
      { $unwind: "$user" },
      {
        $project: {
          _id: 1,
          total: 1,
          qty: 1,
          createdAt: 1,
          event: {
            _id: 1,
            title: { $ifNull: ["$event.title", "(อีเวนต์ถูกลบแล้ว)"] },
          },
          user: { _id: 1, name: 1, email: 1 },
        },
      },
    ]);

    res.render("organizer/dashboard", {
      summary,
      chartLabels,
      chartValues,
      recent: recentAgg,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
};

/* -------------------------------------------------
 🎟️ CHECK-IN SYSTEM
-------------------------------------------------- */

// ✅ หน้า Check-in
exports.getCheckinPage = async (req, res) => {
  res.render("organizer/checkin", {
    title: "Check-in Tickets",
    currentUser: req.session.user,
  });
};

// ✅ ค้นหาตั๋ว
exports.searchTicket = async (req, res) => {
  try {
    const { keyword } = req.body;
    if (!keyword)
      return res.json({
        success: false,
        message: "กรุณากรอก Ticket ID หรือ Ticket Code",
      });

    const query = {
      $or: [{ ticketCode: keyword }, { qrToken: keyword }],
    };

    if (mongoose.Types.ObjectId.isValid(keyword)) {
      query.$or.push({ _id: new mongoose.Types.ObjectId(keyword) });
    }

    const ticket = await Ticket.findOne(query)
      .populate("booking")
      .populate("event")
      .populate("owner");

    if (!ticket) return res.json({ success: false, message: "ไม่พบตั๋วนี้" });

    res.json({ success: true, ticket });
  } catch (err) {
    console.error(err);
    res.json({ success: false, message: "เกิดข้อผิดพลาดในการค้นหา" });
  }
};

// ✅ ยืนยันเช็กอิน
exports.confirmCheckin = async (req, res) => {
  try {
    const { ticketId } = req.body;
    const ticket = await Ticket.findById(ticketId).populate("event");

    if (!ticket) return res.json({ success: false, message: "ไม่พบตั๋วนี้" });
    if (ticket.status === "used")
      return res.json({ success: false, message: "ตั๋วนี้ถูกเช็คอินแล้ว" });

    if (ticket.event.organizer.toString() !== req.session.user._id.toString())
      return res.json({
        success: false,
        message: "คุณไม่มีสิทธิ์เช็คอินงานนี้",
      });

    ticket.status = "used";
    ticket.checkedInAt = new Date();
    await ticket.save();

    res.json({ success: true, message: "เช็คอินสำเร็จ", ticket });
  } catch (err) {
    console.error(err);
    res.json({ success: false, message: "เกิดข้อผิดพลาดขณะเช็คอิน" });
  }
};

// ✅ ยกเลิกบัตร
exports.cancelTicket = async (req, res) => {
  try {
    const { ticketId } = req.body;
    const ticket = await Ticket.findById(ticketId).populate("event");

    if (!ticket) return res.json({ success: false, message: "ไม่พบตั๋วนี้" });

    if (ticket.event.organizer.toString() !== req.session.user._id.toString())
      return res.json({
        success: false,
        message: "คุณไม่มีสิทธิ์ยกเลิกงานนี้",
      });

    ticket.status = "cancelled";
    ticket.checkedInAt = null;
    await ticket.save();

    res.json({ success: true, message: "ยกเลิกบัตรสำเร็จ", ticket });
  } catch (err) {
    console.error(err);
    res.json({ success: false, message: "เกิดข้อผิดพลาดขณะยกเลิก" });
  }
};
