const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: Number(process.env.EMAIL_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  // logger: true, // เพิ่ม log debug
  debug: true,
});

async function sendOTP(email, otp) {
  const mailOptions = {
    from: `"Event Ticketing" <thanakorn.ler@ku.th>`,
    to: email,
    subject: "ยืนยันอีเมลของคุณ (OTP)",
    html: `
      <div style="font-family:Arial,sans-serif; padding:20px; border:1px solid #eee;">
        <h2>รหัสยืนยัน OTP</h2>
        <p>รหัส OTP ของคุณคือ:</p>
        <h1 style="color:#28a745; letter-spacing:3px;">${otp}</h1>
        <p>รหัสนี้จะหมดอายุใน 1 นาที</p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ ส่ง OTP ไปที่ ${email} เรียบร้อยแล้ว`);
  } catch (err) {
    console.error("❌ ส่งอีเมลไม่สำเร็จ:", err);
  }
}

module.exports = { sendOTP };
