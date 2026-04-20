const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

async function sendOtpEmail(toEmail, otp) {
  await transporter.sendMail({
    from: `"Campus Marketplace" <${process.env.SMTP_USER}>`,
    to: toEmail,
    subject: 'Your Campus Marketplace verification code',
    html: `
      <div style="font-family:sans-serif;max-width:400px;margin:auto;padding:32px;border:1px solid #e2e8f0;border-radius:12px;">
        <h2 style="color:#1D3557;margin-bottom:8px;">Verify your email</h2>
        <p style="color:#555;margin-bottom:24px;">Enter this code on the registration page. It expires in <strong>10 minutes</strong>.</p>
        <div style="font-size:36px;font-weight:700;letter-spacing:12px;color:#1D3557;text-align:center;padding:16px;background:#f0f4f8;border-radius:8px;">${otp}</div>
        <p style="color:#999;font-size:12px;margin-top:24px;">If you didn't request this, ignore this email.</p>
      </div>
    `,
  });
}

module.exports = { sendOtpEmail };
