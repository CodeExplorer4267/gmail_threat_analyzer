import { useEffect, useState } from "react";
import { motion as Motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { BsGlobe2, BsFileEarmarkLock2 } from "react-icons/bs";
import { IoMailOpenOutline } from "react-icons/io5";
import { FaCircleCheck, FaArrowLeftLong } from "react-icons/fa6";
import { HiOutlineClock, HiOutlineSparkles } from "react-icons/hi2";
import ShinyText from "../animated/ShinyText";

const API_BASE = "/api";

const sessionBenefits = [
  {
    title: "Website Threat Defense",
    desc: "Analyze suspicious URLs, redirects, and phishing pages before they reach users.",
    icon: BsGlobe2,
  },
  {
    title: "Email Protection",
    desc: "Catch spoofing, malicious links, and social engineering attempts inside the inbox.Download chrome extension for real-time Gmail threat detection",
    icon: IoMailOpenOutline,
  },
  {
    title: "File Screening",
    desc: "Inspect attachments and uploaded files for risky behavior and hidden payloads.",
    icon: BsFileEarmarkLock2,
  },
];

function formatDate(value) {
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

async function apiRequest(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.message || "Something went wrong. Please try again.");
  }

  return payload;
}

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState("email");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [previewOtp, setPreviewOtp] = useState("");
  const [session, setSession] = useState(null);
  const [isLoadingSession, setIsLoadingSession] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function restoreSession() {
      try {
        const data = await apiRequest("/auth/session", { method: "GET" });
        if (!isMounted) {
          return;
        }

        setSession(data.session);
        setEmail(data.session.email);
        setMessage("Welcome back. Your session is still active.");
      } catch {
        if (!isMounted) {
          return;
        }

        setSession(null);
      } finally {
        if (isMounted) {
          setIsLoadingSession(false);
        }
      }
    }

    restoreSession();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleSendOtp = async () => {
    const normalizedEmail = email.trim().toLowerCase();

    if (!/^[a-zA-Z0-9._%+-]+@gmail\.com$/i.test(normalizedEmail)) {
      setError("Enter a valid Gmail address to continue.");
      setMessage("");
      return;
    }

    setIsSubmitting(true);
    try {
      const data = await apiRequest("/auth/send-otp", {
        method: "POST",
        body: JSON.stringify({ email: normalizedEmail }),
      });

      setEmail(normalizedEmail);
      setPreviewOtp(data.previewOtp || "");
      setStep("otp");
      setOtp("");
      setError("");
      setMessage(data.message);
    } catch (requestError) {
      setError(requestError.message);
      setMessage("");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyOtp = async () => {
    setIsSubmitting(true);
    try {
      const data = await apiRequest("/auth/verify-otp", {
        method: "POST",
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          otp: otp.trim(),
        }),
      });

      setSession(data.session);
      setEmail(data.session.email);
      setPreviewOtp("");
      setOtp("");
      setError("");
      setMessage(data.message);
    } catch (requestError) {
      setError(requestError.message);
      setMessage("");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = async () => {
    setIsSubmitting(true);
    try {
      await apiRequest("/auth/logout", { method: "POST", body: JSON.stringify({}) });
    } catch {
      // Keep the client responsive even if the server session is already gone.
    } finally {
      setStep("email");
      setSession(null);
      setEmail("");
      setOtp("");
      setPreviewOtp("");
      setMessage("");
      setError("");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#080511] text-white">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(139,92,246,0.3),_transparent_25%),radial-gradient(circle_at_85%_15%,_rgba(217,70,239,0.18),_transparent_22%),radial-gradient(circle_at_72%_76%,_rgba(91,33,182,0.24),_transparent_28%),linear-gradient(135deg,_#140a22_0%,_#080511_50%,_#11081f_100%)]" />
        <div className="absolute left-14 top-20 h-80 w-80 rounded-full bg-violet-500/18 blur-[120px]" />
        <div className="absolute bottom-10 right-10 h-96 w-96 rounded-full bg-fuchsia-500/12 blur-[160px]" />
      </div>

      <div className="relative z-10 mx-auto flex min-h-screen max-w-7xl flex-col px-6 py-6 sm:px-8 lg:px-10">
        <div className="flex items-center justify-between">
          <Link
            to="/"
            className="inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200 backdrop-blur-xl transition hover:border-violet-200/40 hover:text-white"
          >
            <FaArrowLeftLong />
            Back to Home
          </Link>

          <div className="rounded-full border border-violet-300/20 bg-violet-400/10 px-4 py-2 text-xs uppercase tracking-[0.32em] text-violet-100">
            Secure Access
          </div>
        </div>

        <div className="grid flex-1 items-center gap-10 py-10 lg:grid-cols-[1fr_480px]">
          <div className="max-w-3xl">
            <Motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7 }}
              className="inline-flex items-center gap-2 rounded-full border border-violet-300/20 bg-violet-400/10 px-4 py-2 text-sm text-violet-100"
            >
              <HiOutlineSparkles />
              Gmail OTP verification with 3-day device session
            </Motion.div>

            <Motion.h1
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08, duration: 0.7 }}
              className="mt-8 text-5xl font-semibold leading-[1.02] tracking-[-0.04em] text-white sm:text-6xl"
            >
              Sign in to your
              {" "}
              <ShinyText
                text="Threat Shield workspace"
                speed={3}
                color="#d8b4fe"
                shineColor="#ffffff"
                className="font-semibold"
              />
            </Motion.h1>

            <Motion.p
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.16, duration: 0.7 }}
              className="mt-6 max-w-2xl text-lg leading-8 text-slate-300"
            >
              Verify with Gmail, confirm your OTP, and keep a secure session active for 3 days
              so trusted users can return without repeating the full login flow every time.
            </Motion.p>

            <div className="mt-10 grid gap-4 md:grid-cols-3">
              {sessionBenefits.map((item, index) => (
                <Motion.div
                  key={item.title}
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + index * 0.08, duration: 0.65 }}
                  className="rounded-[1.6rem] border border-white/10 bg-white/5 p-5 backdrop-blur-xl"
                >
                  <div className="inline-flex rounded-2xl border border-violet-300/20 bg-violet-400/10 p-3 text-2xl text-violet-100">
                    <item.icon />
                  </div>
                  <h2 className="mt-5 text-xl font-semibold text-white">{item.title}</h2>
                  <p className="mt-3 text-sm leading-6 text-slate-400">{item.desc}</p>
                </Motion.div>
              ))}
            </div>
          </div>

          <Motion.div
            initial={{ opacity: 0, x: 36 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.15, duration: 0.8 }}
            className="rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(30,18,48,0.95),rgba(10,7,20,0.95))] p-5 shadow-[0_30px_80px_rgba(0,0,0,0.5)] backdrop-blur-xl"
          >
            <div className="rounded-[1.7rem] border border-white/10 bg-[#090613]/90 p-6 sm:p-8">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm uppercase tracking-[0.32em] text-violet-200/70">Threat Shield Auth</p>
                  <h2 className="mt-3 text-3xl font-semibold text-white">Secure login</h2>
                </div>
                <div className="rounded-2xl border border-violet-300/20 bg-violet-400/10 px-4 py-3 text-right">
                  <p className="text-xs uppercase tracking-[0.22em] text-violet-100/60">Session life</p>
                  <p className="mt-1 text-xl font-semibold text-violet-100">3 days</p>
                </div>
              </div>

              <div className="mt-8 grid grid-cols-3 gap-3 text-center text-sm">
                {["Gmail", "OTP", "Session"].map((label, index) => (
                  <div
                    key={label}
                    className={`rounded-2xl border px-4 py-3 ${
                      (step === "email" && index === 0) ||
                      (step === "otp" && index <= 1) ||
                      session
                        ? "border-violet-300/30 bg-violet-400/10 text-violet-100"
                        : "border-white/10 bg-white/[0.03] text-slate-500"
                    }`}
                  >
                    {label}
                  </div>
                ))}
              </div>

              {message ? (
                <div className="mt-6 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-200">
                  {message}
                </div>
              ) : null}

              {error ? (
                <div className="mt-4 rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-200">
                  {error}
                </div>
              ) : null}

              {isLoadingSession ? (
                <div className="mt-8 rounded-[1.5rem] border border-white/10 bg-white/[0.03] px-4 py-6 text-sm text-slate-300">
                  Checking for an active backend session...
                </div>
              ) : session ? (
                <div className="mt-8 space-y-5">
                  <div className="rounded-[1.7rem] border border-violet-300/20 bg-violet-400/10 p-5">
                    <div className="flex items-start gap-3">
                      <div className="rounded-full bg-emerald-400/14 p-2 text-emerald-300">
                        <FaCircleCheck />
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold text-white">Session active</h3>
                        <p className="mt-2 text-sm leading-6 text-slate-300">
                          Signed in as <span className="font-medium text-violet-100">{session.email}</span>.
                          Your session remains valid until {formatDate(session.expiresAt)}.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <button
                      className="rounded-2xl bg-violet-400 px-5 py-4 font-semibold text-slate-950 transition hover:bg-violet-300"
                      onClick={() => navigate("/")}
                    >
                      Continue to Platform
                    </button>
                    <button
                      className="rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-4 font-semibold text-slate-200 transition hover:border-violet-200/30 hover:bg-violet-400/10 disabled:cursor-not-allowed disabled:opacity-60"
                      onClick={handleReset}
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? "Signing out..." : "Use another Gmail"}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="mt-8 space-y-5">
                  <div className="space-y-3">
                    <label htmlFor="gmail" className="block text-sm text-slate-400">
                      Gmail address
                    </label>
                    <input
                      id="gmail"
                      type="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      placeholder="you@gmail.com"
                      className="w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-4 text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-violet-300 disabled:cursor-not-allowed disabled:opacity-60"
                      disabled={isSubmitting}
                    />
                  </div>

                  {step === "otp" ? (
                    <div className="space-y-3">
                      <label htmlFor="otp" className="block text-sm text-slate-400">
                        Enter 6-digit OTP
                      </label>
                      <input
                        id="otp"
                        type="text"
                        inputMode="numeric"
                        maxLength={6}
                        value={otp}
                        onChange={(event) => setOtp(event.target.value.replace(/\D/g, ""))}
                        placeholder="000000"
                        className="w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-4 text-center text-2xl tracking-[0.45em] text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-violet-300 disabled:cursor-not-allowed disabled:opacity-60"
                        disabled={isSubmitting}
                      />
                    </div>
                  ) : null}

                  <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-4">
                    <div className="flex items-start gap-3">
                      <HiOutlineClock className="mt-0.5 text-lg text-violet-200" />
                      <div className="text-sm leading-6 text-slate-300">
                        <p>OTP codes stay valid for 10 minutes.</p>
                        <p>Verified sessions stay active for 3 days on this device.</p>
                      </div>
                    </div>
                  </div>

                  {previewOtp ? (
                    <div className="rounded-[1.5rem] border border-violet-300/20 bg-violet-400/10 p-4 text-sm text-violet-100">
                      Demo preview OTP: <span className="font-semibold tracking-[0.35em]">{previewOtp}</span>
                    </div>
                  ) : null}

                  <div className="grid gap-3 sm:grid-cols-2">
                    {step === "email" ? (
                      <button
                        className="rounded-2xl bg-violet-400 px-5 py-4 font-semibold text-slate-950 transition hover:bg-violet-300 disabled:cursor-not-allowed disabled:opacity-60"
                        onClick={handleSendOtp}
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? "Sending..." : "Send OTP"}
                      </button>
                    ) : (
                      <button
                        className="rounded-2xl bg-violet-400 px-5 py-4 font-semibold text-slate-950 transition hover:bg-violet-300 disabled:cursor-not-allowed disabled:opacity-60"
                        onClick={handleVerifyOtp}
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? "Verifying..." : "Verify and Continue"}
                      </button>
                    )}

                    <button
                      className="rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-4 font-semibold text-slate-200 transition hover:border-violet-200/30 hover:bg-violet-400/10 disabled:cursor-not-allowed disabled:opacity-60"
                      onClick={step === "email" ? () => navigate("/") : handleSendOtp}
                      disabled={isSubmitting}
                    >
                      {step === "email" ? "Cancel" : "Resend OTP"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </Motion.div>
        </div>
      </div>
    </div>
  );
};

export default Login;
