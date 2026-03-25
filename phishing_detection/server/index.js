import cors from "cors";
import express from "express";
import session from "express-session";
import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();
const app=express()

const PORT = Number(process.env.PORT) || 5000;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN ;
const SESSION_SECRET = process.env.SESSION_SECRET ;
const SESSION_DURATION = 3 * 24 * 60 * 60 * 1000;
const OTP_DURATION = 10 * 60 * 1000;

//to store otp we have to create a map
const otpStore= new Map()


app.use(
  cors({
    origin: CLIENT_ORIGIN,
    credentials: true,
  })
);
app.use(express.json());

//It sets up a user session → so your server can remember users (like OTP, login, etc.)
app.use( //enable session middleware
  session({
    name: "threat-shield-session",
    secret: SESSION_SECRET, //Used to sign/encrypt session ID
    resave: false, //Don’t save session again if nothing changed
    saveUninitialized: false, //Don’t create session until something is stored
    cookie: {
      httpOnly: true,
      maxAge: SESSION_DURATION,
      sameSite: "lax", //Helps prevent CSRF attacks
// Allows normal navigation, blocks risky cross-site requests
      secure: false,
    },
  })
);

//function to check if the gmail is valid and to create a otp
function isValidGmail(email) {
  return /^[a-zA-Z0-9._%+-]+@gmail\.com$/i.test(email);
}

function generateOtp(){
   return String(Math.floor(100000+Math.random()*900000))
}

// This function creates and returns a Nodemailer email transporter for sending OTP emails using Gmail. First, it checks whether the environment variables SMTP_USER and SMTP_PASS are set—if not, it returns null, meaning email sending is disabled. If the credentials exist, it configures a transporter with Gmail’s service and authentication details (email + app password). This transporter is then used to securely send OTP emails to users.

function getSmtpTransport(){
   if(!process.env.SMTP_USER || !process.env.SMTP_PASS){
    return null
   }
   return nodemailer.createTransport({
     service:"gmail",
     auth:{
       user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
     },
   });
}

async function sendOtpEmail(email, code) {
  const transporter = getSmtpTransport();
  if (!transporter) {
    return false;
  }

  await transporter.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to: email,
    subject: "Your Threat Shield OTP",
    text: `Your Threat Shield OTP is ${code}. It expires in 10 minutes.`,
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

  let deliveredByEmail = false;
  try {
    deliveredByEmail = await sendOtpEmail(email, code);
  } catch (error) {
    console.error("Failed to send OTP email:", error);
  }

  return res.json({
    message: deliveredByEmail
      ? `OTP sent to ${email}.`
      : `OTP generated for ${email}. Configure SMTP_USER and SMTP_PASS to send real email.`,
    expiresAt,
    previewOtp: deliveredByEmail ? undefined : code,
  });
});

app.post("/api/auth/verify-otp", (req, res) => {
  const email = String(req.body?.email || "").trim().toLowerCase();
  const otp = String(req.body?.otp || "").trim();
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
});
