const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: Number(process.env.EMAIL_PORT || 587),
  secure: String(process.env.SMTP_SECURE || "false") === "true",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

async function sendOtpEmail({ to, otp, purpose }) {
  const subject =
    purpose === "super_admin_password_reset"
      ? "Your Super Admin password reset OTP"
      : purpose === "password_reset"
      ? "Your password reset OTP"
      : "Verify your account OTP";

  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6;">
      <h2>${subject}</h2>
      <p>Your OTP code is:</p>
      <h1 style="letter-spacing: 4px;">${otp}</h1>
      <p>This OTP is valid for 10 minutes.</p>
      <p>If you did not request this, please ignore this email.</p>
    </div>
  `;

  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to,
      subject,
      html,
    });
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.warn(`[mail] OTP email fallback for ${to}: ${otp}`);
      return;
    }

    throw error;
  }
}

async function sendAccountDeletionEmail({ to, name, reason }) {
  const subject = "Your account has been deactivated";
  const safeName = name || "User";
  const safeReason = reason || "No reason provided";

  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6;">
      <h2>Account Deactivation Notice</h2>
      <p>Hello ${safeName},</p>
      <p>Your account has been deactivated by an administrator.</p>
      <p><strong>Reason:</strong> ${safeReason}</p>
      <p>If you believe this is incorrect, please contact society administration.</p>
    </div>
  `;

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM || process.env.SMTP_USER,
      to,
      subject,
      html,
    });
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.warn(`[mail] Account deletion email fallback for ${to}. Reason: ${safeReason}`);
      return;
    }

    throw error;
  }
}

async function sendVisitorArrivalEmails({
  ownerEmail,
  ownerName,
  visitorEmail,
  visitorName,
  flatNumber,
  wing,
}) {
  const from = process.env.SMTP_FROM || process.env.SMTP_USER;

  if (!from) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[mail] SMTP_FROM/SMTP_USER not set; visitor emails skipped");
      return;
    }
  }

  const ownerSubject = "Visitor arrived at your society gate";
  const ownerHtml = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6;">
      <h2>Visitor Arrival Alert</h2>
      <p>Hello ${ownerName || "Resident"},</p>
      <p><strong>${visitorName || "A visitor"}</strong> has arrived at the gate.</p>
      <p>Flat: <strong>${flatNumber || "-"}</strong> | Wing: <strong>${wing || "-"}</strong></p>
      <p>Please coordinate with security for confirmation.</p>
    </div>
  `;

  const visitorSubject = "Your society visit entry is confirmed";
  const visitorHtml = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6;">
      <h2>Entry Confirmed</h2>
      <p>Hello ${visitorName || "Visitor"},</p>
      <p>Your entry has been recorded successfully.</p>
      <p>Destination: Flat <strong>${flatNumber || "-"}</strong>, Wing <strong>${wing || "-"}</strong></p>
      <p>Thank you for visiting.</p>
    </div>
  `;

  try {
    if (ownerEmail) {
      await transporter.sendMail({
        from,
        to: ownerEmail,
        subject: ownerSubject,
        html: ownerHtml,
      });
    }

    if (visitorEmail) {
      await transporter.sendMail({
        from,
        to: visitorEmail,
        subject: visitorSubject,
        html: visitorHtml,
      });
    }
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[mail] Visitor arrival email fallback", {
        ownerEmail,
        visitorEmail,
        visitorName,
        flatNumber,
        wing,
      });
      return;
    }

    throw error;
  }
}

module.exports = {
  sendOtpEmail,
  sendAccountDeletionEmail,
  sendVisitorArrivalEmails,
};
