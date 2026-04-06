import { motion as Motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { FaFacebook, FaInstagram, FaLinkedin, FaShieldAlt } from "react-icons/fa";
import { IoMailOpenOutline } from "react-icons/io5";
import { BsGlobe2, BsFileEarmarkLock2 } from "react-icons/bs";
import { HiOutlineChartBarSquare, HiOutlineBellAlert } from "react-icons/hi2";
import { LuScanSearch, LuArrowRight } from "react-icons/lu";
import { FaCircleCheck, FaLocationDot, FaXTwitter } from "react-icons/fa6";
import { SiGmail } from "react-icons/si";
import ShinyText from "../animated/ShinyText";

const features = [
  {
    title: "Website Phishing Analysis",
    desc: "Inspect suspicious URLs, landing pages, and redirects before users click into danger.",
    icon: BsGlobe2,
  },
  {
    title: "Email Threat Detection",
    desc: "Scan inbox messages for spoofing, malicious links, urgent lures, and unsafe senders.",
    icon: IoMailOpenOutline,
  },
  {
    title: "File Risk Screening",
    desc: "Check attachments and downloads for malware indicators, tampering, and suspicious behavior.",
    icon: BsFileEarmarkLock2,
  },
  {
    title: "Real-Time Alerts",
    desc: "Flag threats instantly so teams can block, review, and respond before damage spreads.",
    icon: HiOutlineBellAlert,
  },
  {
    title: "Deep Threat Scanning",
    desc: "Combine rule-based analysis with automated signal checks across URLs, domains, and files.",
    icon: LuScanSearch,
  },
  {
    title: "Security Insights",
    desc: "Turn detections into dashboards, trends, and evidence your analysts can act on quickly.",
    icon: HiOutlineChartBarSquare,
  },
];

const stats = [
  { value: "24/7", label: "Threat monitoring" },
  { value: "3 Layers", label: "Website, email, file" },
  { value: "< 5s", label: "Average scan response" },
];

const workflow = [
  "Capture suspicious websites, emails, and files the moment they enter your environment.",
  "Run them through layered phishing detection and behavior-focused checks for faster triage.",
  "Surface verdicts, alerts, and evidence inside one unified threat response dashboard.",
];

const landingVariants = {
  hidden: { opacity: 0, y: 28 },
  visible: (index = 0) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: index * 0.12,
      duration: 0.7,
      ease: [0.22, 1, 0.36, 1],
    },
  }),
};

const quickSignals = [
  "Spoofed sender patterns detected in email headers",
  "Suspicious website redirect chain mapped in seconds",
  "Risky attachment behavior isolated before opening",
];

const LandingPage = () => {
  const navigate = useNavigate();

  const handleLogin = async () => {
    try {
      const response = await fetch("/api/auth/session", { credentials: "include" });
      if (response.ok) {
        navigate("/dashboard");
        return;
      }
    } catch {
      // Fall through to login when the session check fails.
    }
    navigate("/login");
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#080511] text-white">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(139,92,246,0.28),_transparent_24%),radial-gradient(circle_at_80%_18%,_rgba(168,85,247,0.22),_transparent_22%),radial-gradient(circle_at_75%_80%,_rgba(91,33,182,0.26),_transparent_25%),linear-gradient(135deg,_#140a22_0%,_#080511_48%,_#11081f_100%)]" />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-violet-300/80 to-transparent" />
        <div className="absolute left-24 top-20 h-72 w-72 rounded-full bg-violet-500/20 blur-[120px]" />
        <div className="absolute bottom-20 right-10 h-80 w-80 rounded-full bg-fuchsia-500/15 blur-[140px]" />
      </div>

      <div className="relative z-10 mx-auto w-full max-w-7xl px-6 pb-16 pt-6 sm:px-8 lg:px-10">
        <nav className="flex items-center justify-between rounded-full border border-white/10 bg-white/5 px-5 py-4 backdrop-blur-xl">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-violet-200/80">Threat Shield</p>
            <h1 className="mt-1 text-lg font-semibold tracking-[0.08em] text-white">Phishing Detection Suite</h1>
          </div>

          <div className="hidden items-center gap-8 text-sm text-slate-300 md:flex">
            <a href="#features" className="transition hover:text-violet-200">Features</a>
            <a href="#workflow" className="transition hover:text-violet-200">Workflow</a>
            <a href="#contact" className="transition hover:text-violet-200">Contact</a>
          </div>

          <button
            className="rounded-full bg-violet-400 px-6 py-3 text-sm font-semibold text-slate-950 shadow-[0_0_40px_rgba(167,139,250,0.25)] transition hover:-translate-y-0.5 hover:bg-violet-300"
            onClick={handleLogin}
          >
            Login
          </button>
        </nav>

        <section className="grid min-h-[calc(100vh-9rem)] items-center gap-14 py-16 lg:grid-cols-[1.08fr_0.92fr] lg:py-24">
          <div className="max-w-3xl text-left">
            <Motion.div
              custom={0}
              initial="hidden"
              animate="visible"
              variants={landingVariants}
              className="inline-flex items-center gap-2 rounded-full border border-violet-300/20 bg-violet-400/10 px-4 py-2 text-sm text-violet-100"
            >
              <span className="h-2 w-2 rounded-full bg-violet-300 shadow-[0_0_14px_rgba(196,181,253,0.85)]" />
              Website, email, and file protection in one platform
            </Motion.div>
            
            <Motion.h2
              custom={1}
              initial="hidden"
              animate="visible"
              variants={landingVariants}
              className="mt-8 max-w-4xl text-5xl font-semibold leading-[1.02] tracking-[-0.04em] text-white sm:text-6xl lg:text-7xl"
            >
              Detect phishing attacks before
              <span className="bg-gradient-to-r from-violet-200 via-fuchsia-300 to-purple-400 bg-clip-text text-transparent"> websites, emails, or files</span>
              {" "}turn into incidents.
            </Motion.h2>

            <Motion.p
              custom={2}
              initial="hidden"
              animate="visible"
              variants={landingVariants}
              className="mt-8 max-w-2xl text-lg leading-8 text-slate-300"
            >
              Protect users from malicious links, deceptive messages, and dangerous attachments
              with a dark, modern detection system built for fast security decisions.
            </Motion.p>

            <Motion.div
              custom={3}
              initial="hidden"
              animate="visible"
              variants={landingVariants}
              className="mt-10 flex flex-col gap-4 sm:flex-row"
            >
              <button
                className="inline-flex items-center justify-center gap-3 rounded-full bg-violet-400 px-8 py-4 text-base font-semibold text-slate-950 transition hover:-translate-y-1 hover:bg-violet-300"
                onClick={handleLogin}
              >
                Start Protecting
                <LuArrowRight />
              </button>
              <button className="rounded-full border border-violet-300/35 bg-slate-950/40 px-8 py-4 text-base font-semibold text-violet-100 transition hover:-translate-y-1 hover:border-violet-200 hover:bg-violet-400/10">
                View Threat Demo
              </button>
            </Motion.div>

            <Motion.div
              custom={4}
              initial="hidden"
              animate="visible"
              variants={landingVariants}
              className="mt-12 grid gap-4 sm:grid-cols-3"
            >
              {stats.map((item) => (
                <div
                  key={item.label}
                  className="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl"
                >
                  <p className="text-3xl font-semibold text-white">{item.value}</p>
                  <p className="mt-2 text-sm text-slate-400">{item.label}</p>
                </div>
              ))}
            </Motion.div>
          </div>

          <Motion.div
            initial={{ opacity: 0, x: 48 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="relative"
          >
            <div className="absolute -right-10 top-8 hidden h-28 w-28 rounded-full bg-violet-400/20 blur-3xl lg:block" />
            <div className="rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(30,18,48,0.95),rgba(10,7,20,0.92))] p-5 shadow-[0_30px_80px_rgba(0,0,0,0.5)] backdrop-blur-xl">
              <div className="rounded-[1.7rem] border border-white/10 bg-[#090613]/90 p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm uppercase tracking-[0.3em] text-violet-200/70">Live Threat Status</p>
                    <h3 className="mt-3 text-2xl font-semibold text-white">Unified Detection Overview</h3>
                  </div>
                  <div className="rounded-2xl border border-violet-300/20 bg-violet-400/10 px-4 py-3 text-right">
                    <p className="text-xs uppercase tracking-[0.25em] text-violet-100/70">Blocked today</p>
                    <p className="mt-1 text-2xl font-semibold text-violet-200">128</p>
                  </div>
                </div>

                <div className="mt-8 grid gap-4 sm:grid-cols-2">
                  <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                    <p className="text-sm text-slate-400">Detection Confidence</p>
                    <p className="mt-3 text-4xl font-semibold text-white">97.4%</p>
                    <div className="mt-5 h-2 rounded-full bg-white/5">
                      <div className="h-2 w-[87%] rounded-full bg-gradient-to-r from-violet-300 via-fuchsia-300 to-purple-500" />
                    </div>
                  </div>
                  <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                    <p className="text-sm text-slate-400">Escalation Speed</p>
                    <p className="mt-3 text-4xl font-semibold text-white">3 min</p>
                    <p className="mt-5 text-sm text-violet-200">Analysts alerted with high-risk evidence</p>
                  </div>
                </div>

                <div className="mt-6 grid gap-3">
                  {quickSignals.map((item) => (
                    <div
                      key={item}
                      className="flex items-center gap-3 rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-4 text-left"
                    >
                      <div className="rounded-full bg-violet-400/12 p-2 text-violet-200">
                        <FaCircleCheck />
                      </div>
                      <p className="text-sm leading-6 text-slate-300">{item}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-6 grid gap-3 sm:grid-cols-3">
                  {[
                    { label: "Web", value: "42 threats" },
                    { label: "Email", value: "61 threats" },
                    { label: "Files", value: "25 threats" },
                  ].map((item) => (
                    <div key={item.label} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-center">
                      <p className="text-sm uppercase tracking-[0.22em] text-slate-500">{item.label}</p>
                      <p className="mt-2 text-lg font-semibold text-white">{item.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Motion.div>
        </section>

        <section id="features" className="py-10">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-sm uppercase tracking-[0.35em] text-violet-200/70">Protection Layers</p>
            <h2 className="mt-4 text-4xl font-semibold tracking-[-0.03em] text-white sm:text-5xl">
              A phishing defense experience designed to feel fast, sharp, and trustworthy
            </h2>
          </div>

          <div className="mt-14 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {features.map((item, index) => (
              <Motion.div
                key={item.title}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.3 }}
                custom={index}
                variants={landingVariants}
                whileHover={{ y: -8 }}
                className="group rounded-[1.8rem] border border-white/10 bg-[linear-gradient(180deg,rgba(26,16,42,0.95),rgba(11,8,22,0.9))] p-7 shadow-[0_20px_60px_rgba(0,0,0,0.3)]"
              >
                <div className="inline-flex rounded-2xl border border-violet-300/20 bg-violet-400/10 p-4 text-3xl text-violet-200 transition group-hover:scale-105">
                  <item.icon />
                </div>
                <h3 className="mt-6 text-2xl font-semibold text-white">{item.title}</h3>
                <p className="mt-4 text-base leading-7 text-slate-400">{item.desc}</p>
              </Motion.div>
            ))}
          </div>
        </section>

        <section id="workflow" className="grid gap-6 py-18 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-8 backdrop-blur-xl">
            <p className="text-sm uppercase tracking-[0.35em] text-violet-200/70">Detection Flow</p>
            <h2 className="mt-4 max-w-xl text-4xl font-semibold tracking-[-0.03em] text-white">
              From incoming threat to confident verdict in one connected workflow
            </h2>
            <p className="mt-6 max-w-lg text-base leading-7 text-slate-300">
              The platform is built around the real phishing problem: identify fast, score accurately,
              and present evidence clearly enough for people to act without second-guessing.
            </p>
          </div>

          <div className="grid gap-4">
            {workflow.map((item, index) => (
              <Motion.div
                key={item}
                initial={{ opacity: 0, x: 24 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.12, duration: 0.6 }}
                viewport={{ once: true, amount: 0.35 }}
                className="flex gap-5 rounded-[1.8rem] border border-white/10 bg-slate-950/70 p-6"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-violet-400 text-lg font-semibold text-slate-950">
                  0{index + 1}
                </div>
                <p className="text-base leading-7 text-slate-300">{item}</p>
              </Motion.div>
            ))}
          </div>
        </section>

        <section className="py-8">
          <div className="rounded-[2.2rem] border border-violet-300/20 bg-[linear-gradient(135deg,rgba(139,92,246,0.18),rgba(192,38,211,0.16),rgba(15,10,30,0.88))] p-8 sm:p-10 lg:p-14">
            <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
              <div className="max-w-2xl">
                <p className="text-sm uppercase tracking-[0.35em] text-violet-100/80">Security First</p>
                <h2 className="mt-4 text-4xl font-semibold tracking-[-0.03em] text-white sm:text-5xl">
                  Ready to protect people from phishing websites, emails, and files?
                </h2>
              </div>

              <button
                className="inline-flex items-center justify-center rounded-full bg-white px-8 py-4 text-base font-semibold text-slate-950 transition hover:-translate-y-1 hover:bg-violet-100"
                onClick={handleLogin}
              >
                Launch Dashboard
              </button>
            </div>
          </div>
        </section>

        <footer
          id="contact"
          className="mt-12 grid gap-8 rounded-[2rem] border border-white/10 bg-black/25 p-8 backdrop-blur-xl md:grid-cols-3"
        >
          <div className="space-y-5">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-violet-200/70">Get in touch</p>
              <h2 className="mt-3 text-3xl font-semibold text-white">Build safer inboxes and safer clicks</h2>
            </div>
            <div className="space-y-4 text-slate-300">
              <div className="flex items-start gap-3">
                <FaLocationDot className="mt-1 text-violet-200" />
                <p>Barasat, Kolkata, West Bengal, India</p>
              </div>
              <div className="flex items-start gap-3">
                <SiGmail className="mt-1 text-violet-200" />
                <p>rupambhadra478@gmail.com</p>
              </div>
              <div className="flex items-start gap-3">
                <FaShieldAlt className="mt-1 text-violet-200" />
                <p>Threat detection for websites, emails, and file attachments</p>
              </div>
            </div>
          </div>

          <div className="space-y-5">
            <h3 className="text-xl font-semibold text-white">Why this fits your project</h3>
            <p className="text-base leading-7 text-slate-300">
              The page now speaks directly to phishing detection instead of exams, with product sections
              centered on malicious websites, deceptive emails, and unsafe files. The violet palette also
              gives it a more distinct security-product identity.
            </p>
            <div className="flex gap-3 text-lg text-violet-100">
              {[FaFacebook, FaInstagram, FaLinkedin, FaXTwitter].map((Icon, index) => (
                <a
                  key={index}
                  href="#contact"
                  className="rounded-full border border-white/10 bg-white/5 p-3 transition hover:-translate-y-1 hover:border-violet-200/40 hover:bg-violet-400/10"
                >
                  <Icon />
                </a>
              ))}
            </div>
          </div>

          <div className="space-y-5">
            <h3 className="text-xl font-semibold text-white">Threat intel updates</h3>
            <p className="text-base leading-7 text-slate-300">
              Stay informed about phishing trends, new attack patterns, and product updates.
            </p>
            <div className="rounded-[1.6rem] border border-white/10 bg-white/[0.04] p-4">
              <label className="mb-3 block text-sm text-slate-400" htmlFor="email-input">
                Work email
              </label>
              <input
                id="email-input"
                type="email"
                placeholder="Enter your email"
                className="w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-violet-300"
              />
              <button className="mt-4 w-full rounded-2xl bg-violet-400 px-5 py-3 font-semibold text-slate-950 transition hover:bg-violet-300">
                Subscribe
              </button>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default LandingPage;
