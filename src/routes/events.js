const express = require("express");
const router = express.Router();
const upload = require("../middleware/upload");
const { hasRole } = require("../middleware/auth");
const eventController = require("../controllers/eventController");

// ---------------- PUBLIC ----------------
router.get("/events/:id", eventController.showEventDetail);

// ---------------- ORGANIZER ----------------
router.get("/organizer/events", hasRole("organizer"), eventController.listOrganizerEvents);
router.get("/organizer/events/new", hasRole("organizer"), eventController.newEventForm);
router.post("/organizer/events", hasRole("organizer"), upload.single("image"), eventController.createEvent);
router.get("/organizer/events/:id/edit", hasRole("organizer"), eventController.editEventForm);
router.put("/organizer/events/:id", hasRole("organizer"), upload.single("image"), eventController.updateEvent);
router.delete("/organizer/events/:id", hasRole("organizer"), eventController.deleteEvent);

module.exports = router;
