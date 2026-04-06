import { BsFileEarmarkLock2, BsGlobe2 } from "react-icons/bs";
import { HiOutlineSparkles } from "react-icons/hi2";
import { IoMailOpenOutline } from "react-icons/io5";

export const API_BASE = "/api";
export const GMAIL_EXTENSION_DOWNLOAD = "/downloads/gmail-detection-extension.zip";

export const workspaceNavigation = [
  {
    path: "/dashboard",
    label: "Dashboard",
    description: "Threat overview and quick actions",
    icon: HiOutlineSparkles,
  },
  {
    path: "/dashboard/email-detection",
    label: "Email Detection",
    description: "Extension download and inbox protection",
    icon: IoMailOpenOutline,
  },
  {
    path: "/dashboard/website-detection",
    label: "Website Detection",
    description: "URL pre-checks and phishing signals",
    icon: BsGlobe2,
  },
  {
    path: "/dashboard/file-detection",
    label: "File Detection",
    description: "Attachment and upload risk review",
    icon: BsFileEarmarkLock2,
  },
];

export const extensionFeatures = [
  "Suspicious sender and domain pattern checks inside Gmail.",
  "URL analysis support for links that try to pull users into phishing flows.",
  "Attachment-aware analysis modules so risky files stand out faster.",
];

export const extensionContents = [
  { title: "manifest.json", description: "Defines the browser extension and required Gmail permissions." },
  { title: "content.js", description: "Connects the extension directly to the Gmail interface." },
  { title: "background.js", description: "Keeps detection tasks available across tabs and sessions." },
  { title: "popup/", description: "Provides the extension popup and quick control surface." },
  { title: "Analyzer/", description: "Holds the URL, domain, and attachment analyzers already in the repo." },
];

export const extensionInstallSteps = [
  "Download the Gmail extension zip from this page.",
  "Extract the zip so the manifest and analyzer files sit inside the unpacked folder.",
  "Open Chrome or Edge, then visit chrome://extensions or edge://extensions.",
  "Enable Developer mode, choose Load unpacked, and select the extracted gmail_detection folder.",
];

export const recommendedWorkflow = [
  "Start with Email Detection to install the Gmail extension for day-to-day inbox monitoring.",
  "Review suspicious URLs in Website Detection before users click through landing pages.",
  "Use File Detection to triage uploads and attachments before they are opened internally.",
];

export function formatDate(value) {
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function getAvatarLetters(email) {
  const localPart = email?.split("@")[0] || "user";
  const letters = localPart.replace(/[^a-z0-9]/gi, "").slice(0, 2).toUpperCase();
  return letters || "TS";
}

export function getCurrentWorkspacePage(pathname) {
  const normalizedPath = pathname.replace(/\/$/, "") || "/dashboard";

  return (
    workspaceNavigation.find((item) => item.path !== "/dashboard" && normalizedPath.startsWith(item.path)) ||
    workspaceNavigation[0]
  );
}

export function analyzeWebsiteUrl(value) {
  const rawValue = value.trim();
  if (!rawValue) {
    return {
      status: "idle",
      score: 0,
      verdict: "Add a URL to begin the quick check.",
      host: "",
      normalizedUrl: "",
      signals: [],
    };
  }

  const candidate = /^[a-z]+:\/\//i.test(rawValue) ? rawValue : `https://${rawValue}`;

  let parsedUrl;
  try {
    parsedUrl = new URL(candidate);
  } catch {
    return {
      status: "invalid",
      score: 92,
      verdict: "This URL format looks invalid and should be reviewed before anyone opens it.",
      host: "",
      normalizedUrl: rawValue,
      signals: [
        {
          label: "The URL format could not be parsed cleanly.",
          severity: "high",
        },
      ],
    };
  }

  const host = parsedUrl.hostname.toLowerCase();
  const reviewSurface = `${host}${parsedUrl.pathname}`.toLowerCase();
  const signals = [];

  if (parsedUrl.protocol !== "https:") {
    signals.push({ label: "The destination is not using HTTPS.", severity: "high" });
  }

  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(host)) {
    signals.push({ label: "The destination uses a raw IP address instead of a domain.", severity: "high" });
  }

  if (host.includes("xn--")) {
    signals.push({ label: "The domain contains punycode characters that can hide lookalikes.", severity: "high" });
  }

  if ((host.match(/-/g) || []).length >= 3) {
    signals.push({ label: "The domain contains several hyphens, which is common in spoofed hosts.", severity: "medium" });
  }

  if (rawValue.includes("@")) {
    signals.push({ label: "The URL includes an @ symbol, which can hide the real destination.", severity: "high" });
  }

  if (host.split(".").length > 4) {
    signals.push({ label: "The host contains many subdomains and deserves extra review.", severity: "medium" });
  }

  if (/(login|verify|account|secure|update|payment|bank|wallet)/i.test(reviewSurface)) {
    signals.push({ label: "Credential or urgency keywords appear in the domain or path.", severity: "medium" });
  }

  const score = Math.min(
    100,
    signals.reduce((total, signal) => total + (signal.severity === "high" ? 28 : 16), 14)
  );

  return {
    status: "ready",
    score,
    verdict:
      score >= 70
        ? "High review priority"
        : score >= 40
          ? "Needs manual review"
          : "Low-risk at a glance",
    host,
    normalizedUrl: parsedUrl.toString(),
    signals,
  };
}

export function analyzeFile(file) {
  const fileName = file.name.toLowerCase();
  const extension = fileName.includes(".") ? fileName.split(".").pop() : "";
  const signals = [];

  if (["exe", "msi", "bat", "cmd", "scr", "ps1", "js", "vbs"].includes(extension)) {
    signals.push({ label: "Executable or script-based file type.", severity: "high" });
  }

  if (["docm", "xlsm", "pptm"].includes(extension)) {
    signals.push({ label: "Macro-enabled Office document.", severity: "high" });
  }

  if (["zip", "rar", "7z", "iso"].includes(extension)) {
    signals.push({ label: "Archived or containerized file that can hide nested payloads.", severity: "medium" });
  }

  if (file.size > 25 * 1024 * 1024) {
    signals.push({ label: "Large file size that should be validated before sharing internally.", severity: "medium" });
  }

  if (/(invoice|urgent|payment|reset|statement|secure|kyc)/i.test(fileName)) {
    signals.push({ label: "Filename uses business-urgent wording often seen in phishing lures.", severity: "medium" });
  }

  const score = Math.min(
    100,
    signals.reduce((total, signal) => total + (signal.severity === "high" ? 30 : 16), 8)
  );

  return {
    extension: extension || "unknown",
    score,
    verdict:
      score >= 70
        ? "High review priority"
        : score >= 40
          ? "Needs manual review"
          : "Low-risk at a glance",
    signals,
  };
}
