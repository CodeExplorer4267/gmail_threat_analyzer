import { motion as Motion } from "framer-motion";
import { BsFileEarmarkLock2, BsGlobe2 } from "react-icons/bs";
import { FaArrowRightLong, FaCircleCheck } from "react-icons/fa6";
import { HiOutlineSparkles } from "react-icons/hi2";
import { IoMailOpenOutline } from "react-icons/io5";
import { Link } from "react-router-dom";
import Panel from "./Panel";
import { formatDate, recommendedWorkflow } from "../dashboardUtils";

export default function DashboardHome({ session }) {
  const overviewCards = [
    {
      title: "Email workspace",
      description: "Download the Gmail extension package and guide users through browser installation.",
      to: "/dashboard/email-detection",
      accent: "Ready for download",
    },
    {
      title: "Website checks",
      description: "Run a quick front-end review for suspicious URLs, hosts, and login lures.",
      to: "/dashboard/website-detection",
      accent: "Client-side pre-checks",
    },
    {
      title: "File triage",
      description: "Review risky filenames and extensions before attachments reach internal users.",
      to: "/dashboard/file-detection",
      accent: "Attachment-aware review",
    },
  ];

  return (
    <div className="space-y-6">
      <Motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55 }}
        className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]"
      >
        <Panel className="p-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-violet-300/20 bg-violet-400/10 px-4 py-2 text-sm text-violet-100">
            <HiOutlineSparkles />
            Threat Shield workspace
          </div>

          <h1 className="mt-6 max-w-3xl text-4xl font-semibold tracking-[-0.03em] text-white sm:text-5xl">
            Welcome back, {session.email.split("@")[0]}
          </h1>

          <p className="mt-4 max-w-2xl text-base leading-8 text-slate-300 sm:text-lg">
            Your authenticated workspace now includes a sidebar-driven dashboard, a top navbar with
            profile avatar, and dedicated pages for email, website, and file detection. This session
            remains active until {formatDate(session.expiresAt)}.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              to="/dashboard/email-detection"
              className="inline-flex items-center justify-center gap-3 rounded-full bg-violet-400 px-6 py-4 text-sm font-semibold text-slate-950 transition hover:-translate-y-0.5 hover:bg-violet-300"
            >
              Open Email Detection
              <FaArrowRightLong />
            </Link>
            <Link
              to="/dashboard/website-detection"
              className="inline-flex items-center justify-center gap-3 rounded-full border border-white/10 bg-white/[0.04] px-6 py-4 text-sm font-semibold text-slate-100 transition hover:border-violet-200/30 hover:bg-violet-400/10"
            >
              Review Website Signals
            </Link>
          </div>
        </Panel>

        <Panel className="p-6">
          <p className="text-sm uppercase tracking-[0.3em] text-violet-200/70">Session Snapshot</p>

          <div className="mt-5 rounded-[1.6rem] border border-violet-300/20 bg-violet-400/10 p-5">
            <p className="text-xs uppercase tracking-[0.24em] text-violet-100/70">Authenticated Gmail</p>
            <p className="mt-2 text-2xl font-semibold text-white">{session.email}</p>
          </div>

          <div className="mt-5 space-y-3">
            {[
              "Sidebar navigation keeps the four work areas organized after login.",
              "Navbar avatar gives the signed-in user an always-visible identity marker.",
              "The Gmail extension is packaged for download from the email detection page.",
            ].map((item) => (
              <div
                key={item}
                className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-4"
              >
                <div className="rounded-full bg-emerald-400/14 p-2 text-emerald-300">
                  <FaCircleCheck />
                </div>
                <p className="text-sm leading-6 text-slate-300">{item}</p>
              </div>
            ))}
          </div>
        </Panel>
      </Motion.div>

      <div className="grid gap-6 xl:grid-cols-3">
        {overviewCards.map((card) => (
          <Panel key={card.title} className="p-6">
            <p className="text-xs uppercase tracking-[0.24em] text-violet-200/70">{card.accent}</p>
            <h2 className="mt-4 text-2xl font-semibold text-white">{card.title}</h2>
            <p className="mt-3 text-sm leading-7 text-slate-400">{card.description}</p>
            <Link
              to={card.to}
              className="mt-6 inline-flex items-center gap-3 text-sm font-semibold text-violet-100 transition hover:text-white"
            >
              Go to page
              <FaArrowRightLong />
            </Link>
          </Panel>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_0.9fr]">
        <Panel className="p-6">
          <p className="text-sm uppercase tracking-[0.3em] text-violet-200/70">Suggested Flow</p>
          <div className="mt-5 space-y-4">
            {recommendedWorkflow.map((item, index) => (
              <div
                key={item}
                className="flex gap-4 rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-4"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-violet-400 font-semibold text-slate-950">
                  0{index + 1}
                </div>
                <p className="text-sm leading-7 text-slate-300">{item}</p>
              </div>
            ))}
          </div>
        </Panel>

        <Panel className="p-6">
          <p className="text-sm uppercase tracking-[0.3em] text-violet-200/70">Coverage Today</p>
          <div className="mt-5 grid gap-4 sm:grid-cols-3 xl:grid-cols-1">
            {[
              { label: "Email", value: "Extension ready", icon: IoMailOpenOutline },
              { label: "Web", value: "URL quick review", icon: BsGlobe2 },
              { label: "Files", value: "Upload triage", icon: BsFileEarmarkLock2 },
            ].map((item) => (
              <div key={item.label} className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-5">
                <div className="inline-flex rounded-2xl border border-violet-300/20 bg-violet-400/10 p-3 text-xl text-violet-100">
                  <item.icon />
                </div>
                <p className="mt-4 text-sm uppercase tracking-[0.22em] text-slate-500">{item.label}</p>
                <p className="mt-2 text-xl font-semibold text-white">{item.value}</p>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  );
}
