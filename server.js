require("dotenv").config();
const express = require("express");
const path = require("path");
const morgan = require("morgan");
const session = require("express-session");
const flash = require("connect-flash");
const methodOverride = require("method-override");
const engine = require("ejs-mate");
const MongoStore = require("connect-mongo");

// Database
const { connectDB } = require("./src/config/db");

// Models
const { Event } = require("./src/models/Event");

// Routes
const authRoutes = require("./src/routes/auth");
const eventRoutes = require("./src/routes/events");
const bookingRoutes = require("./src/routes/bookings");
const organizerRoutes = require("./src/routes/organizer");
const accountRoutes = require("./src/routes/account");
const ticketRoutes = require("./src/routes/tickets");

// Connect Database
connectDB();

// App setup
const app = express();
const PORT = process.env.PORT || 3000;

app.engine("ejs", engine);
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "src/views"));

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(methodOverride("_method"));
app.use(morgan("dev"));
app.use(express.static(path.join(__dirname, "src/public")));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use(
  session({
    secret: process.env.SESSION_SECRET || "devsecret",
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: process.env.MONGODB_URI,  // คุณมี MONGO_URI อยู่แล้ว
      ttl: 24 * 60 * 60, // อายุ session = 1 วัน
    }),
    cookie: {
      secure: process.env.NODE_ENV === "production", // true เมื่อรันบน Vercel
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 24 * 60 * 60 * 1000, // อายุ cookie = 1 วัน
    },
  })
);
app.use(flash());

// Expose user & flash messages to views
app.use((req, res, next) => {
  res.locals.currentUser = req.session?.user || null;
  res.locals.success = req.flash("success");
  res.locals.error = req.flash("error");
  res.locals.danger = req.flash("danger");
  next();
});


/* -------------------------------------------------------------------------- */
/*                                  ROUTES                                     */
/* -------------------------------------------------------------------------- */
app.use("/", authRoutes);
app.use("/", eventRoutes);
app.use("/", bookingRoutes);
app.use("/", organizerRoutes);
app.use("/", accountRoutes);
app.use("/", ticketRoutes);

/* -------------------------------------------------------------------------- */
/*                               HOME PAGE                                     */
/* -------------------------------------------------------------------------- */
app.get("/", async (req, res) => {
  const q = req.query.q || "";
  const filter = q ? { title: new RegExp(q, "i") } : {};
  const events = await Event.find(filter).sort({ date: 1 }).lean();
  res.render("index", { events, q });
});

/* -------------------------------------------------------------------------- */
/*                                  404                                         */
/* -------------------------------------------------------------------------- */
app.use((req, res) => res.status(404).render("404"));

/* -------------------------------------------------------------------------- */
/*                                START SERVER                                  */
/* -------------------------------------------------------------------------- */
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
