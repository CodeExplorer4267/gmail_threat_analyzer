import cors from "cors";
import path from "node:path";
import express from "express";
import session from "express-session";
import nodemailer from "nodemailer";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, ".env"), quiet: true });


const app = express();

const PORT = Number(process.env.PORT) || 5000;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || "http://localhost:5173";
const SESSION_SECRET = process.env.SESSION_SECRET || "threat-shield-dev-secret";
const IS_PRODUCTION = process.env.NODE_ENV === "production";
const SESSION_DURATION = 3 * 24 * 60 * 60 * 1000;
const OTP_DURATION = 10 * 60 * 1000;
const SMTP_USER = process.env.SMTP_USER?.trim() || "";
const SMTP_PASS = process.env.SMTP_PASS?.replace(/\s+/g, "") || "";
const SMTP_FROM =  SMTP_USER;
const HAS_SMTP_CONFIG = Boolean(SMTP_USER && SMTP_PASS);

const otpStore = new Map();

app.use(
  cors({
    origin: CLIENT_ORIGIN,
    credentials: true,
  })
);
app.use(express.json());
app.use(
  session({
    name: "threat-shield-session",
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      maxAge: SESSION_DURATION,
      sameSite: IS_PRODUCTION ? "none" : "lax",
      secure: IS_PRODUCTION,
    },
  })
);

function isValidGmail(email) {
  return /^[a-zA-Z0-9._%+-]+@gmail\.com$/i.test(email);
}

function generateOtp() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function getSmtpTransport() {
  if (!HAS_SMTP_CONFIG) {
    return null;
  }

  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
  });
}

async function sendOtpEmail(email, code) {
  const transporter = getSmtpTransport();
  if (!transporter) {
    return false;
  }

  await transporter.sendMail({
    from: "rupambhadra478@gmail.com",
    to: email,
    subject: "Your Threat Shield OTP",
    text: `Your Threat Shield OTP is ${code}. It expires in 10 minutes.`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; color: #111827;">
        <h2 style="margin-bottom: 12px;">Threat Shield Verification</h2>
        <p style="margin-bottom: 16px;">Use the OTP below to complete your login.</p>
        <div style="font-size: 32px; font-weight: 700; letter-spacing: 8px; padding: 16px 20px; background: #f3f4f6; border-radius: 12px; display: inline-block;">
          ${code}
        </div>
        <p style="margin-top: 16px;">This OTP expires in 10 minutes.</p>
      </div>
    `,
  });

  return true;
}

function getSessionPayload(req) {
  const user = req.session.user;
  if (!user?.expiresAt || user.expiresAt <= Date.now()) {
    req.session.user = null;
    return null;
  }

  return user;
}

app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
  });
});

app.get("/api/auth/session", (req, res) => {
  const activeSession = getSessionPayload(req);
  if (!activeSession) {
    return res.status(401).json({ message: "No active session found." });
  }

  return res.json({
    session: activeSession,
  });
});

app.post("/api/auth/send-otp", async (req, res) => {
  
  const email = String(req.body?.email || "").trim().toLowerCase();
  if (!isValidGmail(email)) {
    return res.status(400).json({ message: "Enter a valid Gmail address." });
  }

  const code = generateOtp();
  const expiresAt = Date.now() + OTP_DURATION;
  otpStore.set(email, { code, expiresAt });

  try {
    const deliveredByEmail = await sendOtpEmail(email, code);

    if (deliveredByEmail) {
      return res.json({
        message: IS_PRODUCTION
          ? `OTP sent to ${email}.`
          : `OTP sent to ${email}. Dev preview is still shown locally so you can test quickly.`,
        expiresAt,
        delivery: "email",
        previewOtp: IS_PRODUCTION ? undefined : code,
      });
    }
  } catch (error) {
    console.error("Failed to send OTP email:", error);

    if (HAS_SMTP_CONFIG) {
      if (!IS_PRODUCTION) {
        return res.json({
          message: "Email delivery failed, so a dev preview OTP is shown locally. Check your SMTP settings and backend logs.",
          expiresAt,
          delivery: "preview-fallback",
          previewOtp: code,
        });
      }

      otpStore.delete(email);
      return res.status(502).json({
        delivery: "email-error",
        message: "Failed to send OTP email. Check your SMTP settings and backend logs.",
      });
    }
  }

  // return res.json({
  //   message: `OTP generated for ${email}. Configure SMTP_USER and SMTP_PASS to send real email.`,
  //   expiresAt,
  //   delivery: "preview",
  //   previewOtp: code,
  
});

app.post("/api/auth/verify-otp", (req, res) => {
  const email = String(req.body?.email || "").trim().toLowerCase();
  const otp = String(req.body?.otp || "").trim();

  if (!/^\d{6}$/.test(otp)) {
    return res.status(400).json({ message: "Enter a valid 6-digit OTP." });
  }

  const activeOtp = otpStore.get(email);
  if (!activeOtp || activeOtp.expiresAt <= Date.now()) {
    otpStore.delete(email);
    return res.status(400).json({ message: "The OTP has expired. Request a new code." });
  }

  if (activeOtp.code !== otp) {
    return res.status(400).json({ message: "The OTP code is incorrect." });
  }

  const sessionPayload = {
    email,
    issuedAt: Date.now(),
    expiresAt: Date.now() + SESSION_DURATION,
  };

  otpStore.delete(email);
  req.session.user = sessionPayload;

  return res.json({
    message: "Verification complete. Your access session is active for 3 days.",
    session: sessionPayload,
  });
});

app.post("/api/auth/logout", (req, res) => {
  req.session.destroy(() => {
    res.clearCookie("threat-shield-session");
    res.json({ message: "Logged out successfully." });
  });
});

app.listen(PORT, () => {
  console.log(`Threat Shield backend listening on http://localhost:${PORT}`);
  console.log(HAS_SMTP_CONFIG ? "SMTP mode enabled." : "SMTP mode disabled. Using preview OTP mode.");
});
