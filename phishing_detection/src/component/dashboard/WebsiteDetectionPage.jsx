import { useState } from "react";
import { motion as Motion } from "framer-motion";
import { BsGlobe2 } from "react-icons/bs";
import Panel from "./Panel";
import { analyzeWebsiteUrl } from "../dashboardUtils";

export default function WebsiteDetectionPage() {
  const [websiteUrl, setWebsiteUrl] = useState("http://secure-account-update.example/login");
  const analysis = analyzeWebsiteUrl(websiteUrl);

  return (
    <div className="space-y-6">
      <Motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55 }}
      >
        <Panel className="p-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-violet-300/20 bg-violet-400/10 px-4 py-2 text-sm text-violet-100">
            <BsGlobe2 />
            Website Detection
          </div>

          <h1 className="mt-6 text-4xl font-semibold tracking-[-0.03em] text-white sm:text-5xl">
            Quick URL review
          </h1>

          <p className="mt-4 max-w-3xl text-base leading-8 text-slate-300 sm:text-lg">
            This page gives users a lightweight website pre-check before they open a suspicious link.
            It highlights common phishing indicators directly in the browser.
          </p>

          <div className="mt-8 rounded-[1.7rem] border border-white/10 bg-black/20 p-5">
            <label htmlFor="website-url" className="block text-sm text-slate-400">
              Suspicious URL
            </label>
            <input
              id="website-url"
              type="text"
              value={websiteUrl}
              onChange={(event) => setWebsiteUrl(event.target.value)}
              placeholder="https://example.com/login"
              className="mt-3 w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-4 text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-violet-300"
            />
          </div>
        </Panel>
      </Motion.div>

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <Panel className="p-6">
          <p className="text-sm uppercase tracking-[0.3em] text-violet-200/70">Risk Summary</p>
          <div className="mt-5 rounded-[1.6rem] border border-violet-300/20 bg-violet-400/10 p-5">
            <p className="text-xs uppercase tracking-[0.24em] text-violet-100/70">Verdict</p>
            <p className="mt-2 text-3xl font-semibold text-white">{analysis.verdict}</p>
            <p className="mt-3 text-sm text-slate-300">
              Score: <span className="font-semibold text-violet-100">{analysis.score}/100</span>
            </p>
          </div>

          <div className="mt-5 rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-4 text-sm leading-7 text-slate-300">
            <p>Normalized URL</p>
            <p className="mt-2 break-all font-medium text-white">
              {analysis.normalizedUrl || "Add a URL to view the normalized address."}
            </p>
            {analysis.host ? (
              <p className="mt-3 text-slate-400">
                Host: <span className="font-medium text-slate-200">{analysis.host}</span>
              </p>
            ) : null}
          </div>
        </Panel>

        <Panel className="p-6">
          <p className="text-sm uppercase tracking-[0.3em] text-violet-200/70">Detected Signals</p>
          <div className="mt-5 space-y-3">
            {analysis.signals.length ? (
              analysis.signals.map((signal) => (
                <div
                  key={signal.label}
                  className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] px-4 py-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-base font-semibold text-white">{signal.label}</p>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${
                        signal.severity === "high"
                          ? "border border-rose-300/20 bg-rose-500/10 text-rose-200"
                          : "border border-amber-300/20 bg-amber-500/10 text-amber-200"
                      }`}
                    >
                      {signal.severity}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-[1.5rem] border border-emerald-300/20 bg-emerald-500/10 px-4 py-4 text-sm text-emerald-100">
                No obvious client-side phishing signals were found in this quick review.
              </div>
            )}
          </div>
        </Panel>
      </div>
    </div>
  );
}
