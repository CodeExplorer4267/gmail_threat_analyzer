import { useState } from "react";
import { motion as Motion } from "framer-motion";
import { BsFileEarmarkLock2 } from "react-icons/bs";
import { FaCircleCheck, FaTriangleExclamation } from "react-icons/fa6";
import Panel from "./Panel";
import {
  FILE_SCAN_UI_MAX_MB,
  formatFileSize,
  getStatusClasses,
  scanFileWithBackend,
} from "./fileScanClient";

const detectionLayers = [
  "File type validation to compare the filename extension with the actual file signature.",
  "SHA-256 hashing so the backend can support reputation or blocklist matching.",
  "Static analysis for macro indicators, suspicious PDF actions, embedded URLs, and nested payload names.",
  "Risk scoring from 0 to 100 so results are actionable instead of only clean or infected.",
];

const safetyPrinciples = [
  "Files are scanned in memory only and are never executed by the backend.",
  `Single-file uploads are capped at ${FILE_SCAN_UI_MAX_MB} MB in the current dashboard workflow.`,
  "This is a layered heuristic scanner, so medium and high scores should trigger review rather than blind trust.",
];

function getFileKey(file) {
  return `${file.name}-${file.size}-${file.lastModified}`;
}

export default function FileDetectionPage() {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [scanResults, setScanResults] = useState([]);
  const [scanError, setScanError] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });

  const oversizedFiles = selectedFiles.filter((file) => file.size > FILE_SCAN_UI_MAX_MB * 1024 * 1024);

  const handleFilesChange = (event) => {
    const files = Array.from(event.target.files || []);
    setSelectedFiles(files);
    setScanResults([]);
    setScanError("");
    setProgress({ current: 0, total: files.length });
  };

  const handleScan = async () => {
    if (!selectedFiles.length) {
      setScanError("Choose at least one file before starting the scan.");
      return;
    }

    if (oversizedFiles.length) {
      setScanError(`Remove files larger than ${FILE_SCAN_UI_MAX_MB} MB before scanning.`);
      return;
    }

    setIsScanning(true);
    setScanError("");
    setScanResults([]);
    setProgress({ current: 0, total: selectedFiles.length });

    const partialResults = [];

    try {
      for (let index = 0; index < selectedFiles.length; index += 1) {
        const file = selectedFiles[index];
        const response = await scanFileWithBackend(file);
        partialResults.push(response.scan);
        setScanResults([...partialResults]);
        setProgress({ current: index + 1, total: selectedFiles.length });
      }
    } catch (error) {
      setScanError(error.message);
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <div className="space-y-6">
      <Motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55 }}
      >
        <Panel className="p-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-violet-300/20 bg-violet-400/10 px-4 py-2 text-sm text-violet-100">
            <BsFileEarmarkLock2 />
            File Detection
          </div>

          <h1 className="mt-6 text-4xl font-semibold tracking-[-0.03em] text-white sm:text-5xl">
            Multi-layer file scanner
          </h1>

          <p className="mt-4 max-w-3xl text-base leading-8 text-slate-300 sm:text-lg">
            This workflow now sends files to the backend for in-memory scanning instead of only showing
            local filename heuristics. The scanner validates file type, hashes the payload, inspects
            phishing-document markers, extracts suspicious URLs, and returns a weighted risk score.
          </p>

          <label className="mt-8 flex cursor-pointer flex-col items-center justify-center rounded-[1.8rem] border border-dashed border-violet-300/30 bg-white/[0.03] px-6 py-12 text-center transition hover:border-violet-200/50 hover:bg-violet-400/10">
            <input type="file" multiple className="hidden" onChange={handleFilesChange} />
            <p className="text-lg font-semibold text-white">Choose files for backend scanning</p>
            <p className="mt-3 text-sm text-slate-400">
              Upload one or more files and the server will return score, verdict, reasons, URLs, and file
              identity details.
            </p>
          </label>

          <div className="mt-6 flex flex-col gap-3 lg:flex-row lg:items-center">
            <button
              type="button"
              className="rounded-full bg-violet-400 px-6 py-4 text-sm font-semibold text-slate-950 transition hover:-translate-y-0.5 hover:bg-violet-300 disabled:cursor-not-allowed disabled:opacity-60"
              onClick={handleScan}
              disabled={isScanning || !selectedFiles.length}
            >
              {isScanning
                ? `Scanning ${progress.current}/${progress.total || selectedFiles.length}`
                : "Run Secure Scan"}
            </button>

            <div className="rounded-full border border-white/10 bg-white/[0.04] px-5 py-4 text-sm text-slate-300">
              Scan limit: <span className="font-semibold text-violet-100">{FILE_SCAN_UI_MAX_MB} MB per file</span>
            </div>
          </div>
        </Panel>
      </Motion.div>

      <div className="grid gap-6 xl:grid-cols-[0.92fr_1.08fr]">
        <Panel className="p-6">
          <p className="text-sm uppercase tracking-[0.3em] text-violet-200/70">Detection Layers</p>
          <div className="mt-5 space-y-3">
            {detectionLayers.map((item) => (
              <div
                key={item}
                className="flex items-start gap-3 rounded-[1.5rem] border border-white/10 bg-white/[0.03] px-4 py-4"
              >
                <div className="rounded-full bg-emerald-400/14 p-2 text-emerald-300">
                  <FaCircleCheck />
                </div>
                <p className="text-sm leading-6 text-slate-300">{item}</p>
              </div>
            ))}
          </div>
        </Panel>

        <Panel className="p-6">
          <p className="text-sm uppercase tracking-[0.3em] text-violet-200/70">Safety Model</p>
          <div className="mt-5 space-y-3">
            {safetyPrinciples.map((item) => (
              <div
                key={item}
                className="flex items-start gap-3 rounded-[1.5rem] border border-white/10 bg-white/[0.03] px-4 py-4"
              >
                <div className="rounded-full bg-sky-400/14 p-2 text-sky-300">
                  <FaCircleCheck />
                </div>
                <p className="text-sm leading-6 text-slate-300">{item}</p>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <Panel className="p-6">
          <p className="text-sm uppercase tracking-[0.3em] text-violet-200/70">Selected Files</p>

          {oversizedFiles.length ? (
            <div className="mt-5 rounded-[1.5rem] border border-amber-300/20 bg-amber-500/10 px-4 py-4 text-sm text-amber-100">
              Remove {oversizedFiles.map((file) => file.name).join(", ")} because they exceed the current
              in-memory scan limit.
            </div>
          ) : null}

          {scanError ? (
            <div className="mt-5 rounded-[1.5rem] border border-rose-300/20 bg-rose-500/10 px-4 py-4 text-sm text-rose-100">
              {scanError}
            </div>
          ) : null}

          <div className="mt-5 space-y-3">
            {selectedFiles.length ? (
              selectedFiles.map((file) => (
                <div
                  key={getFileKey(file)}
                  className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-base font-semibold text-white">{file.name}</p>
                      <p className="mt-2 text-sm text-slate-400">{formatFileSize(file.size)}</p>
                    </div>
                    <span
                      className={`rounded-full px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] ${
                        file.size > FILE_SCAN_UI_MAX_MB * 1024 * 1024
                          ? "border border-amber-300/20 bg-amber-500/10 text-amber-100"
                          : "border border-white/10 bg-black/20 text-slate-300"
                      }`}
                    >
                      {file.size > FILE_SCAN_UI_MAX_MB * 1024 * 1024 ? "Too large" : file.type || "unknown type"}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] px-4 py-4 text-sm text-slate-400">
                No files selected yet.
              </div>
            )}
          </div>
        </Panel>

        <Panel className="p-6">
          <p className="text-sm uppercase tracking-[0.3em] text-violet-200/70">Scan Results</p>

          {isScanning ? (
            <div className="mt-5 rounded-[1.5rem] border border-violet-300/20 bg-violet-400/10 px-4 py-4 text-sm text-violet-100">
              Scanning {progress.current} of {progress.total || selectedFiles.length} file
              {(progress.total || selectedFiles.length) === 1 ? "" : "s"}...
            </div>
          ) : null}

          <div className="mt-5 space-y-4">
            {scanResults.length ? (
              scanResults.map((result) => (
                <div
                  key={`${result.fileName}-${result.sha256}`}
                  className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-5"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <p className="text-xl font-semibold text-white">{result.fileName}</p>
                      <p className="mt-2 text-sm text-slate-400">
                        {formatFileSize(result.sizeBytes)} - {result.detectedType.label}
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className={`rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] ${getStatusClasses(result.status)}`}>
                        {result.status}
                      </span>
                      <div className="rounded-full border border-violet-300/20 bg-violet-400/10 px-4 py-2 text-sm font-semibold text-violet-100">
                        Score {result.riskScore}/100
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 rounded-[1.3rem] border border-white/10 bg-black/20 p-4">
                    <p className="text-sm font-semibold text-white">Recommendation</p>
                    <p className="mt-2 text-sm leading-7 text-slate-300">{result.recommendation}</p>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {result.categories.length ? (
                      result.categories.map((category) => (
                        <span
                          key={category}
                          className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 text-xs uppercase tracking-[0.18em] text-slate-300"
                        >
                          {category}
                        </span>
                      ))
                    ) : (
                      <span className="rounded-full border border-emerald-300/20 bg-emerald-500/10 px-3 py-2 text-xs uppercase tracking-[0.18em] text-emerald-100">
                        low-signal result
                      </span>
                    )}
                  </div>

                  <div className="mt-5 grid gap-3 md:grid-cols-2">
                    <div className="rounded-[1.3rem] border border-white/10 bg-white/[0.03] p-4">
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-500">SHA-256</p>
                      <p className="mt-2 break-all font-mono text-sm text-slate-200">{result.sha256}</p>
                    </div>
                    <div className="rounded-[1.3rem] border border-white/10 bg-white/[0.03] p-4">
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Type Validation</p>
                      <p className="mt-2 text-sm text-slate-200">
                        .{result.extension} vs {result.detectedType.mime}
                      </p>
                      <p className="mt-2 text-xs text-slate-500">
                        {result.checks.fileType.mismatch ? "Mismatch detected" : "No mismatch detected"}
                      </p>
                    </div>
                  </div>

                  <div className="mt-5">
                    <p className="text-sm font-semibold text-white">Reasons</p>
                    <div className="mt-3 space-y-3">
                      {result.reasons.length ? (
                        result.reasons.map((reason) => (
                          <div
                            key={`${reason.layer}-${reason.title}`}
                            className="rounded-[1.2rem] border border-white/10 bg-white/[0.03] px-4 py-4"
                          >
                            <div className="flex flex-wrap items-center justify-between gap-3">
                              <p className="text-base font-semibold text-white">{reason.title}</p>
                              <span className="rounded-full border border-violet-300/20 bg-violet-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-violet-100">
                                +{reason.points} {reason.severity}
                              </span>
                            </div>
                            <p className="mt-2 text-sm leading-6 text-slate-300">{reason.detail}</p>
                            <p className="mt-2 text-xs uppercase tracking-[0.18em] text-slate-500">
                              {reason.layer}
                            </p>
                          </div>
                        ))
                      ) : (
                        <div className="rounded-[1.2rem] border border-emerald-300/20 bg-emerald-500/10 px-4 py-4 text-sm text-emerald-100">
                          No notable heuristics fired during this scan.
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-5 grid gap-4 lg:grid-cols-2">
                    <div className="rounded-[1.3rem] border border-white/10 bg-white/[0.03] p-4">
                      <p className="text-sm font-semibold text-white">Suspicious URLs</p>
                      <div className="mt-3 space-y-3">
                        {result.checks.urlAnalysis.suspiciousUrls.length ? (
                          result.checks.urlAnalysis.suspiciousUrls.map((entry) => (
                            <div
                              key={entry.url}
                              className="rounded-[1rem] border border-white/10 bg-black/20 px-3 py-3"
                            >
                              <p className="break-all text-sm font-medium text-slate-200">{entry.url}</p>
                              <p className="mt-2 text-xs uppercase tracking-[0.18em] text-slate-500">
                                URL score {entry.riskScore}
                              </p>
                              <p className="mt-2 text-sm text-slate-400">
                                {entry.reasons.join(" ") || "Flagged by URL heuristics."}
                              </p>
                            </div>
                          ))
                        ) : (
                          <div className="rounded-[1rem] border border-white/10 bg-black/20 px-3 py-3 text-sm text-slate-400">
                            No suspicious URLs were extracted from the file preview.
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="rounded-[1.3rem] border border-white/10 bg-white/[0.03] p-4">
                      <p className="text-sm font-semibold text-white">Static Analysis Signals</p>
                      <div className="mt-3 space-y-3 text-sm text-slate-300">
                        <div className="rounded-[1rem] border border-white/10 bg-black/20 px-3 py-3">
                          Entropy: <span className="font-semibold text-white">{result.checks.staticAnalysis.entropy}</span>
                        </div>
                        <div className="rounded-[1rem] border border-white/10 bg-black/20 px-3 py-3">
                          Macro indicators:{" "}
                          <span className="font-semibold text-white">
                            {result.checks.staticAnalysis.hasMacroIndicators ? "present" : "none"}
                          </span>
                        </div>
                        <div className="rounded-[1rem] border border-white/10 bg-black/20 px-3 py-3">
                          PDF JavaScript:{" "}
                          <span className="font-semibold text-white">
                            {result.checks.staticAnalysis.hasPdfJavaScript ? "present" : "none"}
                          </span>
                        </div>
                        <div className="rounded-[1rem] border border-white/10 bg-black/20 px-3 py-3">
                          Suspicious keywords:{" "}
                          <span className="font-semibold text-white">
                            {result.checks.staticAnalysis.suspiciousKeywords.length
                              ? result.checks.staticAnalysis.suspiciousKeywords.join(", ")
                              : "none"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 rounded-[1.3rem] border border-sky-300/20 bg-sky-500/10 p-4">
                    <div className="flex items-start gap-3">
                      <div className="rounded-full bg-sky-400/14 p-2 text-sky-300">
                        <FaTriangleExclamation />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-sky-100">{result.engine}</p>
                        <p className="mt-2 text-sm leading-6 text-sky-50/90">{result.notes.join(" ")}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] px-4 py-4 text-sm text-slate-400">
                No scan results yet. Choose files and run the secure scan to see verdicts, reasons, and
                extracted URL findings.
              </div>
            )}
          </div>
        </Panel>
      </div>
    </div>
  );
}
