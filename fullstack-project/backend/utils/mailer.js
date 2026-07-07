const nodemailer = require("nodemailer");

const smtpConfig = {
  host: process.env.SMTP_HOST || process.env.EMAIL_HOST,
  port: Number(process.env.SMTP_PORT || process.env.EMAIL_PORT || 587),
  secure: String(process.env.SMTP_SECURE || process.env.EMAIL_SECURE || "false") === "true",
  auth: {
    user: process.env.SMTP_USER || process.env.EMAIL_USER,
    pass: process.env.SMTP_PASS || process.env.EMAIL_PASS,
  },
};

const transporter = nodemailer.createTransport({
  host: smtpConfig.host,
  port: smtpConfig.port,
  secure: smtpConfig.secure,
  auth: smtpConfig.auth,
  connectionTimeout: 20000,
  greetingTimeout: 20000,
  socketTimeout: 30000,
});

const BRAND_NAME = "NEXORA";
const BRAND_TAGLINE = "Smart Society Management Platform";
const BRAND_COLOR = "#14B8A6";

function brandedEmailShell({ title, preheader = "", body }) {
  return `
    <div style="margin:0;background:#f8fafc;padding:32px 16px;font-family:Inter,Arial,sans-serif;color:#0f172a;">
      <div style="max-width:640px;margin:0 auto;overflow:hidden;border:1px solid #e2e8f0;border-radius:24px;background:#ffffff;box-shadow:0 24px 70px rgba(15,23,42,0.10);">
        <div style="background:#020617;padding:28px 30px;color:#f8fafc;">
          <div style="display:flex;align-items:center;gap:12px;">
            <div style="width:48px;height:48px;border-radius:16px;background:linear-gradient(135deg,#0EA5E9,#14B8A6,#A7F36B);display:inline-block;"></div>
            <div>
              <div style="font-size:24px;font-weight:800;letter-spacing:0;">${BRAND_NAME}</div>
              <div style="font-size:11px;font-weight:700;letter-spacing:0.16em;text-transform:uppercase;color:#a7f3d0;">${BRAND_TAGLINE}</div>
            </div>
          </div>
          ${preheader ? `<p style="margin:18px 0 0;color:#cbd5e1;">${preheader}</p>` : ""}
        </div>
        <div style="padding:30px;">
          <h2 style="margin:0 0 16px;font-size:22px;color:#0f172a;">${title}</h2>
          ${body}
          <p style="margin:28px 0 0;color:#64748b;font-size:13px;">Sent securely by ${BRAND_NAME}.</p>
        </div>
      </div>
    </div>
  `;
}

let transporterVerifyPromise = null;

function getMailFromAddress() {
  return process.env.SMTP_FROM || process.env.EMAIL_FROM || smtpConfig.auth.user;
}

async function verifyTransporter() {
  if (!smtpConfig.host || !smtpConfig.auth.user || !smtpConfig.auth.pass) {
    throw new Error("SMTP configuration is incomplete. Check SMTP_HOST, SMTP_USER, and SMTP_PASS.");
  }

  if (!transporterVerifyPromise) {
    console.log("SMTP CHECK", {
      host: smtpConfig.host,
      port: smtpConfig.port,
      secure: smtpConfig.secure,
      user: smtpConfig.auth.user,
      hasPassword: Boolean(smtpConfig.auth.pass),
      from: getMailFromAddress(),
    });

    transporterVerifyPromise = transporter.verify().then(() => {
      console.log("SMTP READY");
      return true;
    }).catch((error) => {
      console.error("SMTP ERROR:", error);
      throw error;
    });
  }

  return transporterVerifyPromise;
}

async function sendOtpEmail({ to, otp, purpose }) {
  const subject =
    purpose === "super_admin_password_reset"
      ? "Your Super Admin password reset OTP"
      : purpose === "password_reset"
      ? "Your password reset OTP"
      : "Verify your account OTP";

  const html = brandedEmailShell({
    title: subject,
    preheader: "Use this code to continue your secure NEXORA workflow.",
    body: `
      <p style="line-height:1.6;color:#334155;">Your OTP code is:</p>
      <div style="margin:18px 0;padding:18px 22px;border-radius:18px;background:#ecfeff;border:1px solid #99f6e4;font-size:34px;font-weight:900;letter-spacing:8px;color:#0f766e;text-align:center;">${otp}</div>
      <p style="line-height:1.6;color:#334155;">This OTP is valid for 10 minutes.</p>
      <p style="line-height:1.6;color:#64748b;">If you did not request this, please ignore this email.</p>
    `,
  });

  try {
    await verifyTransporter();
    const info = await transporter.sendMail({
      from: getMailFromAddress(),
      to,
      subject,
      html,
    });
    console.log("[MAIL OTP SENT]", {
      to,
      purpose,
      messageId: info.messageId,
    });
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[mail] OTP email send failed", {
        to,
        purpose,
        message: error.message,
      });
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

  const html = brandedEmailShell({
    title: "Account Deactivation Notice",
    body: `
      <p style="line-height:1.6;color:#334155;">Hello ${safeName},</p>
      <p style="line-height:1.6;color:#334155;">Your NEXORA account has been deactivated by an administrator.</p>
      <p style="line-height:1.6;color:#334155;"><strong>Reason:</strong> ${safeReason}</p>
      <p style="line-height:1.6;color:#64748b;">If you believe this is incorrect, please contact your community administrator.</p>
    `,
  });

  try {
    await verifyTransporter();
    await transporter.sendMail({
      from: getMailFromAddress(),
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
  const from = getMailFromAddress();

  if (!from) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[mail] SMTP_FROM/SMTP_USER not set; visitor emails skipped");
      return;
    }
  }

  const ownerSubject = "Visitor arrived at your community gate";
  const ownerHtml = brandedEmailShell({
    title: "Visitor Arrival Alert",
    body: `
      <p style="line-height:1.6;color:#334155;">Hello ${ownerName || "Resident"},</p>
      <p style="line-height:1.6;color:#334155;"><strong>${visitorName || "A visitor"}</strong> has arrived at the gate.</p>
      <p style="line-height:1.6;color:#334155;">Flat: <strong>${flatNumber || "-"}</strong> | Wing: <strong>${wing || "-"}</strong></p>
      <p style="line-height:1.6;color:#64748b;">Please coordinate with security for confirmation.</p>
    `,
  });

  const visitorSubject = "Your NEXORA visit entry is confirmed";
  const visitorHtml = brandedEmailShell({
    title: "Entry Confirmed",
    body: `
      <p style="line-height:1.6;color:#334155;">Hello ${visitorName || "Visitor"},</p>
      <p style="line-height:1.6;color:#334155;">Your entry has been recorded successfully.</p>
      <p style="line-height:1.6;color:#334155;">Destination: Flat <strong>${flatNumber || "-"}</strong>, Wing <strong>${wing || "-"}</strong></p>
      <p style="line-height:1.6;color:#64748b;">Thank you for visiting.</p>
    `,
  });

  try {
    await verifyTransporter();
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
  verifyTransporter,
};
