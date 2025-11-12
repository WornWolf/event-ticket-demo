const bcrypt = require('bcrypt');
const fetch = require('node-fetch');
const { User } = require('../models/User');
const { PendingUser } = require('../models/PendingUser');
const { sendOTP } = require('../utils/mailer');

// ตรวจสอบความแข็งแรงของรหัสผ่าน
function isPasswordStrong(password) {
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSymbol = /[\W]/.test(password);
  const isLongEnough = password.length >= 8;

  let score = 0;
  if (isLongEnough) score++;
  if (hasUpper) score++;
  if (hasLower) score++;
  if (hasNumber) score++;
  if (hasSymbol) score++;

  return score >= 3;
}

/* ----------------------------- REGISTER ----------------------------- */
exports.getRegister = (req, res) => {
  res.render('auth/register', {
    recaptchaSiteKey: process.env.RECAPTCHA_SITE_KEY,
  });
};

exports.postRegister = async (req, res) => {
  const { name, email, password, "g-recaptcha-response": captcha } = req.body;
  
  if (!captcha) {
    req.flash("error", "กรุณายืนยัน CAPTCHA");
    return res.redirect("/register");
  }

  const verifyURL = `https://www.google.com/recaptcha/api/siteverify?secret=${process.env.RECAPTCHA_SECRET_KEY}&response=${captcha}`;

  try {
    const response = await fetch(verifyURL, { method: "POST" });
    const data = await response.json();

    if (!data.success) {
      req.flash("error", "CAPTCHA ไม่ผ่านการยืนยัน");
      return res.redirect("/register");
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      req.flash("error", "Email นี้ถูกใช้ไปแล้ว");
      return res.redirect("/register");
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const hash = await bcrypt.hash(password, 10);

    await PendingUser.findOneAndUpdate(
      { email },
      {
        name,
        email,
        passwordHash: hash,
        otp,
        otpExpires: Date.now() + 60 * 1000,
      },
      { upsert: true }
    );

    await sendOTP(email, otp);
    res.render("auth/verify-otp", { email, timeLeft: 60 });
  } catch (err) {
    console.error(err);
    req.flash("error", "เกิดข้อผิดพลาดระหว่างสมัครสมาชิก");
    res.redirect("/register");
  }
};

// ---------------------- REGISTER WITH OTP ----------------------
exports.getVerifyOtp = async (req, res) => {
  const email = req.query.email;
  if (!email) {
    req.flash("error", "ไม่พบผู้ใช้ โปรดลองสมัครใหม่");
    return res.redirect("/register");
  }

  const pending = await PendingUser.findOne({ email });
  let timeLeft = 60;
  if (pending) {
    const diff = Math.floor((pending.otpExpires - Date.now()) / 1000);
    if (diff > 0) timeLeft = diff;
  }

  res.render("auth/verify-otp", { email, timeLeft, error: req.flash("error"), success: req.flash("success") });
};

exports.postVerifyOtp = async (req, res) => {
  const { email, otp } = req.body;
  try {
    const pending = await PendingUser.findOne({ email });
    if (!pending) {
      req.flash("error", "ไม่พบข้อมูลการสมัคร โปรดลองใหม่");
      return res.redirect("/register");
    }

    if (pending.otpExpires < Date.now()) {
      await PendingUser.deleteOne({ email });
      req.flash("error", "OTP หมดอายุ โปรดลองส่งใหม่");
      return res.redirect("/verify-otp?email=" + encodeURIComponent(email));
    }

    if (pending.otp !== otp) {
      let timeLeft = Math.floor((pending.otpExpires - Date.now()) / 1000);
      if (timeLeft < 0) timeLeft = 0;

      return res.render("auth/verify-otp", { email, error: ["OTP ไม่ถูกต้อง"], timeLeft });
    }

    const user = await User.create({
      name: pending.name,
      email: pending.email,
      passwordHash: pending.passwordHash,
      role: "attendee"
    });
    await PendingUser.deleteOne({ email });

    // **ล็อกอินอัตโนมัติ**
    req.session.user = {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatarUrl: user.avatarUrl || '/img/default-avatar.png'
    };

    req.flash("success", "สมัครสมาชิกสำเร็จ! คุณได้เข้าสู่ระบบเรียบร้อยแล้ว");
    res.redirect("/");
  } catch (err) {
    console.error(err);
    req.flash("error", "เกิดข้อผิดพลาดระหว่างตรวจสอบ OTP");
    res.redirect("/register");
  }
};

exports.postResendOtp = async (req, res) => {
  const { email } = req.body;
  try {
    const pending = await PendingUser.findOne({ email });
    if (!pending) {
      req.flash("error", "ไม่พบผู้ใช้ โปรดลองสมัครใหม่");
      return res.redirect("/register");
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    pending.otp = otp;
    pending.otpExpires = Date.now() + 60 * 1000;
    await pending.save();

    await sendOTP(email, otp);
    req.flash("success", "ส่งรหัส OTP ใหม่แล้ว");
    res.redirect("/verify-otp?email=" + encodeURIComponent(email));
  } catch (err) {
    console.error("Resend OTP error:", err);
    req.flash("error", "ส่งรหัส OTP ไม่สำเร็จ");
    res.redirect("/verify-otp?email=" + encodeURIComponent(email));
  }
};

// ---------------------- SWITCH ROLE ----------------------
exports.postSwitchRole = async (req, res) => {
  try {
    const user = await User.findById(req.session.user._id);
    if (!user) return res.redirect("/");

    user.role = user.role === "organizer" ? "attendee" : "organizer";
    await user.save();

    req.session.user.role = user.role;
    let role = user.role === "organizer" ? "ผู้จัดงาน (Organizer)" : "ผู้เข้าร่วม (Attendee)";
    req.flash("success", `Switch role สำเร็จ! ตอนนี้คุณเป็น ${role}`);
    res.redirect("back");
  } catch (err) {
    console.error(err);
    req.flash("error", "Switch role ไม่สำเร็จ");
    res.redirect("back");
  }
};

/* ----------------------------- LOGIN ----------------------------- */
exports.getLogin = (req, res) => {
  res.render('auth/login', { next: req.query.next || '/' });
};

exports.postLogin = async (req, res) => {
  const { email, password, next } = req.body;

  const user = await User.findOne({ email });
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    req.flash('danger', 'อีเมลหรือรหัสผ่านไม่ถูกต้อง');
    return res.redirect(`/login?next=${encodeURIComponent(next || '/')}`);
  }

  req.session.user = {
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    avatarUrl: user.avatarUrl || '/img/default-avatar.png'
  };

  req.flash('success', 'Welcome back!');
  res.redirect(next || '/');
};

/* ----------------------------- LOGOUT ----------------------------- */
exports.postLogout = (req, res) => {
  req.session.destroy(() => res.redirect('/'));
};

/* ---------------------- FORGOT PASSWORD ---------------------- */
exports.getForgotPassword = (req, res) => {
  res.render('auth/forgot-password', { message: null, body: {} });
};

exports.postForgotPassword = async (req, res) => {
  const { identifier } = req.body;

  let user;
  if (identifier.includes('@')) {
    user = await User.findOne({ email: identifier });
  } else {
    let phone = identifier.replace(/\D/g, '');
    if (phone.startsWith('0')) phone = '+66' + phone.slice(1);
    else if (!phone.startsWith('+')) phone = '+' + phone;
    user = await User.findOne({ phone });
  }

  if (!user) {
    return res.render('auth/forgot-password', {
      message: 'ไม่พบผู้ใช้งานที่มีข้อมูลนี้',
      body: {}
    });
  }

  res.render('auth/reset-password', {
    userId: user._id,
    username: user.name || user.username || user.email,
    message: null
  });
};

/* ---------------------- RESET PASSWORD ---------------------- */
exports.postResetPassword = async (req, res) => {
  const { userId, password, confirmPassword } = req.body;

  const foundUser = await User.findById(userId);
  const username = foundUser ? (foundUser.name || foundUser.username || foundUser.email) : null;

  if (password !== confirmPassword) {
    return res.render('auth/reset-password', {
      userId,
      username,
      message: 'รหัสผ่านไม่ตรงกัน กรุณาลองใหม่'
    });
  }

  if (!isPasswordStrong(password)) {
    return res.render('auth/reset-password', {
      userId,
      username,
      message: 'รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร และรวมตัวพิมพ์ใหญ่ พิมพ์เล็ก ตัวเลข หรือสัญลักษณ์'
    });
  }

  if (!foundUser) {
    return res.render('auth/reset-password', {
      userId: null,
      username: null,
      message: 'ไม่พบผู้ใช้งาน'
    });
  }

  const hashed = await bcrypt.hash(password, 10);
  foundUser.passwordHash = hashed;
  await foundUser.save();

  req.flash('success', 'ตั้งรหัสผ่านใหม่เรียบร้อยแล้ว กรุณาเข้าสู่ระบบ');
  res.redirect('/login');
};
