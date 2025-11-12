// routes/organizer.js
const express = require("express");
const router = express.Router();
const { isAuthenticated, hasRole } = require("../middleware/auth");
const organizerController = require("../controllers/organizerController");

// Dashboard
router.get("/organizer/dashboard", hasRole("organizer"), organizerController.getDashboard);

// Check-in routes
router.get("/organizer/checkin", isAuthenticated, hasRole("organizer"), organizerController.getCheckinPage);
router.post("/organizer/checkin/search", isAuthenticated, hasRole("organizer"), organizerController.searchTicket);
router.post("/organizer/checkin/confirm", isAuthenticated, hasRole("organizer"), organizerController.confirmCheckin);
router.post("/organizer/checkin/cancel", isAuthenticated, hasRole("organizer"), organizerController.cancelTicket);

module.exports = router;
