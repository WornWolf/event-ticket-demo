const express = require("express");
const router = express.Router();
const { isAuthenticated } = require("../middleware/auth");
const ticketController = require("../controllers/ticketController");

// ตรวจสอบบัตร (GET)
router.get("/ticket/verify", ticketController.verifyTicket);

// เช็กอินบัตร (POST)
router.post("/ticket/checkin", isAuthenticated, ticketController.checkinTicket);

module.exports = router;
