import { motion as Motion } from "framer-motion";
import { BsDownload } from "react-icons/bs";
import { FaCircleCheck } from "react-icons/fa6";
import { IoMailOpenOutline } from "react-icons/io5";
import Panel from "./Panel";
import {
  extensionContents,
  extensionFeatures,
  extensionInstallSteps,
  GMAIL_EXTENSION_DOWNLOAD,
} from "../dashboardUtils";

export default function EmailDetectionPage({ session }) {
  return (
    <div className="space-y-6">
      <Motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55 }}
      >
        <Panel className="p-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-violet-300/20 bg-violet-400/10 px-4 py-2 text-sm text-violet-100">
            <IoMailOpenOutline />
            Gmail Detection Extension
          </div>

          <h1 className="mt-6 text-4xl font-semibold tracking-[-0.03em] text-white sm:text-5xl">
            Email Detection
          </h1>

          <p className="mt-4 max-w-3xl text-base leading-8 text-slate-300 sm:text-lg">
            This page gives logged-in users a direct way to download the Gmail detection extension that
            already exists in the repo. After download, they can extract it and apply it inside their
            browser as an unpacked extension for Gmail monitoring.
          </p>

          <div className="mt-8 flex flex-col gap-3 lg:flex-row lg:items-center">
            <a
              href={GMAIL_EXTENSION_DOWNLOAD}
              download
              className="inline-flex items-center justify-center gap-3 rounded-full bg-violet-400 px-6 py-4 text-sm font-semibold text-slate-950 transition hover:-translate-y-0.5 hover:bg-violet-300"
            >
              <BsDownload />
              Download Gmail Extension
            </a>
            <div className="rounded-full border border-white/10 bg-white/[0.04] px-5 py-4 text-sm text-slate-300">
              Signed in as <span className="font-semibold text-violet-100">{session.email}</span>
            </div>
          </div>
        </Panel>
      </Motion.div>

      <div className="grid gap-6 xl:grid-cols-[0.92fr_1.08fr]">
        <Panel className="p-6">
          <p className="text-sm uppercase tracking-[0.3em] text-violet-200/70">What&apos;s Inside</p>
          <div className="mt-5 space-y-3">
            {extensionContents.map((item) => (
              <div
                key={item.title}
                className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] px-4 py-4"
              >
                <p className="text-base font-semibold text-white">{item.title}</p>
                <p className="mt-2 text-sm leading-6 text-slate-400">{item.description}</p>
              </div>
            ))}
          </div>
        </Panel>

        <Panel className="p-6">
          <p className="text-sm uppercase tracking-[0.3em] text-violet-200/70">Install In Browser</p>
          <div className="mt-5 space-y-4">
            {extensionInstallSteps.map((step, index) => (
              <div
                key={step}
                className="flex gap-4 rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-4"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-violet-400 font-semibold text-slate-950">
                  0{index + 1}
                </div>
                <p className="text-sm leading-7 text-slate-300">{step}</p>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {extensionFeatures.map((feature) => (
          <Panel key={feature} className="p-6">
            <div className="inline-flex rounded-2xl border border-violet-300/20 bg-violet-400/10 p-3 text-xl text-violet-100">
              <FaCircleCheck />
            </div>
            <p className="mt-4 text-base leading-7 text-slate-300">{feature}</p>
          </Panel>
        ))}
      </div>
    </div>
  );
}
