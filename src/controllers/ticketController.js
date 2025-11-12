const { Ticket } = require("../models/Ticket");

/**
 * GET /ticket/verify
 * ตรวจสอบบัตรจาก bookingId และ qrToken
 */
exports.verifyTicket = async (req, res) => {
  try {
    const { b, t } = req.query;

    const ticket = await Ticket.findOne({ booking: b, qrToken: t })
      .populate({
        path: "event",
        populate: { path: "organizer", select: "_id name email" },
      })
      .populate("owner", "_id name email")
      .lean();

    if (!ticket) {
      return res.render("ticket/verify", {
        ok: false,
        reason: "บัตรไม่ถูกต้อง",
      });
    }

    res.render("ticket/verify", {
      ok: true,
      ticket,
      currentUser: req.session.user,
    });
  } catch (err) {
    console.error(err);
    res.render("ticket/verify", { ok: false, reason: "เกิดข้อผิดพลาด" });
  }
};

/**
 * POST /ticket/checkin
 * เช็กอินบัตรเข้าร่วมงาน
 */
exports.checkinTicket = async (req, res) => {
  try {
    const { ticketId, t } = req.body;

    if (!ticketId || !t)
      return res.json({ ok: false, message: "พารามิเตอร์ไม่ถูกต้อง" });

    const ticket = await Ticket.findById(ticketId).populate("event owner");

    if (!ticket || ticket.qrToken !== t) {
      return res.json({ ok: false, message: "บัตรไม่ถูกต้อง" });
    }

    // ตรวจสอบสิทธิ์ของเจ้าหน้าที่เช็กอิน
    if (
      ticket.event.organizer._id.toString() !== req.session.user._id.toString()
    ) {
      return res.json({ ok: false, message: "คุณไม่มีสิทธิ์เช็กอินบัตรนี้" });
    }

    if (ticket.status !== "valid") {
      return res.json({ ok: false, message: "บัตรถูกใช้งานหรือยกเลิกแล้ว" });
    }

    // ✅ เช็กอินสำเร็จ
    ticket.status = "used";
    ticket.checkedInAt = new Date();
    await ticket.save();

    res.json({ ok: true, message: "เช็กอินสำเร็จ!" });
  } catch (err) {
    console.error(err);
    res.json({ ok: false, message: "เกิดข้อผิดพลาด" });
  }
};
