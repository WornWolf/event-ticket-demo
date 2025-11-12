// controllers/accountController.js
const bcrypt = require("bcrypt");
const { User } = require("../models/User");
const { cloudinary } = require("../config/cloudinary");

/* -------------------- Helpers -------------------- */

// Clean string
const clean = (s) => (s ?? "").toString().trim();

// Default avatar placeholder (client จะใช้ fallback)
const DEFAULT_AVATAR_URL = "/img/default-avatar.png";

// Normalize Thai phone number
const normalizePhoneTH = (raw) => {
  const digits = clean(raw).replace(/\D/g, "");
  if (!digits) return "";
  return "+66" + digits.replace(/^0/, "");
};

// Destroy Cloudinary image if exists
const destroyIfAny = async (publicId) => {
  if (!publicId) return;
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch {
    // ignore errors
  }
};

// Upload buffer to Cloudinary
const uploadBuffer = (fileBuffer, opts = {}) =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: "avatars", resource_type: "image", ...opts },
      (err, result) => (err ? reject(err) : resolve(result))
    );
    stream.end(fileBuffer);
  });

/* -------------------- GET /me -------------------- */
exports.getAccount = async (req, res) => {
  try {
    const me = await User.findById(req.session.user._id).lean();
    if (!me) {
      req.flash("error", "User not found");
      return res.redirect("/login");
    }

    res.render("account/settings", { me });
  } catch (e) {
    req.flash("error", e.message || "เกิดข้อผิดพลาด");
    res.redirect("/login");
  }
};

/* -------------------- POST /me (Update Account) -------------------- */
exports.updateAccount = async (req, res) => {
  try {
    const user = await User.findById(req.session.user._id);
    if (!user) return res.status(404).json({ success: false, error: "User not found" });

    const updates = {};
    let payload = { success: true };
    const wantRemove = req.body.removeAvatar === "1";
    const file = req.file;

    // -------- ข้อมูลพื้นฐาน --------
    if ("firstName" in req.body) updates.firstName = clean(req.body.firstName);
    if ("lastName" in req.body) updates.lastName = clean(req.body.lastName);
    if ("name" in req.body) updates.name = clean(req.body.name);
    if ("phone" in req.body) updates.phone = normalizePhoneTH(req.body.phone);

    if ("gender" in req.body) {
      const g = clean(req.body.gender).toLowerCase();
      updates.gender = ["male", "female", "other", ""].includes(g) ? g : "";
    }

    if (req.body.dob) {
      const d = new Date(req.body.dob);
      if (!isNaN(d.getTime())) updates.dob = d;
    } else if ("dob" in req.body && !req.body.dob) {
      updates.dob = undefined;
    }

    // -------- Avatar logic --------
    if (wantRemove) {
      await destroyIfAny(user.cloudinary_id);
      updates.avatarUrl = DEFAULT_AVATAR_URL;
      updates.cloudinary_id = "";
      payload.removed = true;
      req.session.user.avatarUrl = DEFAULT_AVATAR_URL;
    } else if (file) {
      const result = await uploadBuffer(file.buffer, {
        public_id: `${user._id}_${Date.now()}`,
        overwrite: true,
        transformation: [{ width: 300, height: 300, crop: "fill" }],
      });
      const oldId = user.cloudinary_id;
      updates.avatarUrl = result.secure_url;
      updates.cloudinary_id = result.public_id;
      payload.avatarUrl = result.secure_url;

      await destroyIfAny(oldId);

      req.session.user.avatarUrl = result.secure_url;
    } else {
      // ❌ เพิ่มตรงนี้: เก็บ avatarUrl เดิม
      updates.avatarUrl = user.avatarUrl;
      updates.cloudinary_id = user.cloudinary_id;
      payload.avatarUrl = user.avatarUrl;
    }

    // -------- บันทึก --------
    user.set(updates);
    await user.save();

    // -------- Sync ชื่อใน session --------
    let displayName = "";
    if (updates.name) {
      req.session.user.name = updates.name;
      displayName = updates.name;
    } else if (updates.firstName || updates.lastName) {
      displayName = `${updates.firstName || ""} ${updates.lastName || ""}`.trim();
      if (displayName) req.session.user.name = displayName;
    } else {
      displayName = req.session.user.name;
    }

    payload.name = displayName;
    return res.json(payload);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ success: false, error: e.message || "อัปเดตไม่สำเร็จ" });
  }
};

/* -------------------- POST /me/change-password -------------------- */
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    // Validation
    if (!currentPassword || !newPassword || !confirmPassword) {
      req.flash("error", "กรุณากรอกข้อมูลให้ครบ");
      return res.redirect("/me#password");
    }
    if (newPassword !== confirmPassword) {
      req.flash("error", "รหัสผ่านใหม่และยืนยันไม่ตรงกัน");
      return res.redirect("/me#password");
    }
    if (newPassword.length < 8) {
      req.flash("error", "รหัสผ่านอย่างน้อย 8 ตัวอักษร");
      return res.redirect("/me#password");
    }

    const user = await User.findById(req.session.user._id);
    if (!user) {
      req.flash("error", "User not found");
      return res.redirect("/login");
    }

    const ok = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!ok) {
      req.flash("error", "รหัสผ่านปัจจุบันไม่ถูกต้อง");
      return res.redirect("/me#password");
    }

    user.passwordHash = await bcrypt.hash(newPassword, 12);
    await user.save();

    req.flash("success", "เปลี่ยนรหัสผ่านเรียบร้อย");
    res.redirect("/me#password");
  } catch (e) {
    req.flash("error", e.message || "เปลี่ยนรหัสผ่านไม่สำเร็จ");
    res.redirect("/me#password");
  }
};
