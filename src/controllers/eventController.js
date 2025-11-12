const { Event } = require("../models/Event");
const { cloudinary } = require("../config/cloudinary");

/* -------------------------------------------------------------------------- */
/*                         HELPER: UPLOAD TO CLOUDINARY                       */
/* -------------------------------------------------------------------------- */
function uploadToCloudinary(buffer) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: "events" },
      (err, result) => {
        if (err) reject(err);
        else resolve(result);
      }
    );
    stream.end(buffer);
  });
}

/* -------------------------------------------------------------------------- */
/*                             🟦 PUBLIC SECTION                              */
/* -------------------------------------------------------------------------- */

// GET /events/:id
exports.showEventDetail = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate("organizer")
      .lean();

    if (!event) return res.status(404).render("404");

    res.render("events/show", { event });
  } catch (err) {
    console.error(err);
    res.status(500).render("500");
  }
};

/* -------------------------------------------------------------------------- */
/*                           🟩 ORGANIZER SECTION                             */
/* -------------------------------------------------------------------------- */

// GET /organizer/events
exports.listOrganizerEvents = async (req, res) => {
  try {
    const events = await Event.find({ organizer: req.session.user._id }).lean();
    const now = new Date();

    // แยก upcoming และ past
    const upcoming = events
      .filter(ev => ev.endDate ? new Date(ev.endDate) >= now : true)
      .sort((a, b) => new Date(a.startDate || a.date) - new Date(b.startDate || b.date)); // ใกล้สุด → ไกลสุด

    const past = events
      .filter(ev => ev.endDate && new Date(ev.endDate) < now)
      .sort((a, b) => new Date(b.startDate || b.date) - new Date(a.startDate || a.date)); // ล่าสุดก่อน

    const sortedEvents = [...upcoming, ...past];

    res.render("organizer/events/index", { events: sortedEvents });
  } catch (err) {
    console.error(err);
    req.flash("error", "Cannot load events");
    res.redirect("/");
  }
};

// GET /organizer/events/new
exports.newEventForm = (req, res) => {
  res.render("organizer/events/new");
};

// POST /organizer/events
exports.createEvent = async (req, res) => {
  try {
    const { title, startDate, endDate, date, description, location, price, tickets, lockStart } = req.body;
    const isLockStart = !!lockStart;

    const payload = {
      title,
      description,
      location,
      price,
      tickets,
      organizer: req.session.user._id,
      lockStart: isLockStart,
    };

    // จัดการวันเวลา
    if (isLockStart) {
      payload.startDate = new Date().toISOString();
      if (endDate) payload.endDate = new Date(endDate).toISOString();
    } else if (startDate && endDate) {
      payload.startDate = new Date(startDate).toISOString();
      payload.endDate = new Date(endDate).toISOString();
    } else if (date) {
      payload.date = new Date(date).toISOString();
    }


    // อัปโหลดรูปภาพ
    if (req.file) {
      const uploadResult = await uploadToCloudinary(req.file.buffer);
      payload.imageUrl = uploadResult.secure_url;
      payload.cloudinary_id = uploadResult.public_id;
    }

    await Event.create(payload);
    req.flash("success", "Event created");
    res.redirect("/organizer/events");
  } catch (err) {
    console.error(err);
    req.flash("error", err.message);
    res.redirect("/organizer/events/new");
  }
};

// GET /organizer/events/:id/edit
exports.editEventForm = async (req, res) => {
  const event = await Event.findOne({
    _id: req.params.id,
    organizer: req.session.user._id,
  }).lean();

  if (!event) return res.status(404).render("404");

  const startLocal = event.startDate
    ? new Date(event.startDate).toLocaleString("sv-SE", { hour12: false }).replace(" ", "T")
    : "";
  const endLocal = event.endDate
    ? new Date(event.endDate).toLocaleString("sv-SE", { hour12: false }).replace(" ", "T")
    : "";

  res.render("organizer/events/edit", {
    event,
    startLocal,
    endLocal,
    lockStart: event.lockStart,
  });
};

// PUT /organizer/events/:id
exports.updateEvent = async (req, res) => {
  try {
    const event = await Event.findOne({
      _id: req.params.id,
      organizer: req.session.user._id,
    });
    if (!event) return res.status(404).render("404");

    const { title, startDate, endDate, date, description, location, price, tickets, lockStart, removeImage } = req.body;
    const isLockStart = !!lockStart;

    const payload = {
      title,
      description,
      location,
      price,
      tickets,
      lockStart: isLockStart,
    };

    // วันที่
    if (isLockStart) {
      payload.startDate = new Date();
      if (endDate) payload.endDate = new Date(endDate);
      payload.date = undefined;
    } else if (startDate && endDate) {
      payload.startDate = new Date(startDate);
      payload.endDate = new Date(endDate);
      payload.date = undefined;
    } else if (date) {
      payload.date = new Date(date);
      payload.startDate = undefined;
      payload.endDate = undefined;
    }

    // รูปภาพ
    const unset = {};
    if (req.file) {
      if (event.cloudinary_id) await cloudinary.uploader.destroy(event.cloudinary_id);
      const uploadResult = await uploadToCloudinary(req.file.buffer);
      payload.imageUrl = uploadResult.secure_url;
      payload.cloudinary_id = uploadResult.public_id;
    } else if (removeImage === "1") {
      if (event.cloudinary_id) await cloudinary.uploader.destroy(event.cloudinary_id);
      unset.imageUrl = 1;
      unset.cloudinary_id = 1;
    }

    const updateOps = {};
    if (Object.keys(payload).length) updateOps.$set = payload;
    if (Object.keys(unset).length) updateOps.$unset = unset;

    await Event.updateOne({ _id: event._id }, updateOps);

    req.flash("success", "Event updated");
    res.redirect("/organizer/events");
  } catch (err) {
    console.error(err);
    req.flash("error", err.message);
    res.redirect(`/organizer/events/${req.params.id}/edit`);
  }
};

// DELETE /organizer/events/:id
exports.deleteEvent = async (req, res) => {
  try {
    const event = await Event.findOne({
      _id: req.params.id,
      organizer: req.session.user._id,
    });

    if (!event) return res.status(404).render("404");

    const eventName = event.title;

    if (event.cloudinary_id) {
      await cloudinary.uploader.destroy(event.cloudinary_id);
    }

    await Event.deleteOne({ _id: event._id });
    req.flash("danger", `Event <strong>${eventName}</strong> Deleted`);
    res.redirect("/organizer/events");
  } catch (err) {
    console.error(err);
    req.flash("error", "Cannot delete event");
    res.redirect("/organizer/events");
  }
};
