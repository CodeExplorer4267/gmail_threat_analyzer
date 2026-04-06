import crypto from "node:crypto";

const EXECUTABLE_EXTENSIONS = new Set(["exe", "dll", "scr", "com", "msi"]);
const SCRIPT_EXTENSIONS = new Set(["js", "jse", "vbs", "vbe", "ps1", "bat", "cmd", "wsf"]);
const ARCHIVE_EXTENSIONS = new Set(["zip", "rar", "7z", "iso"]);
const MACRO_EXTENSIONS = new Set(["docm", "xlsm", "pptm"]);
const DOCUMENT_EXTENSIONS = new Set([
  "pdf",
  "doc",
  "docx",
  "docm",
  "xls",
  "xlsx",
  "xlsm",
  "ppt",
  "pptx",
  "pptm",
  "rtf",
  "txt",
  "csv",
  "html",
  "htm",
]);

const SUSPICIOUS_FILENAME_REGEX = /(invoice|payment|statement|reset|secure|urgent|account|login|kyc|salary)/i;
const DOUBLE_EXTENSION_REGEX = /\.(pdf|docx?|xlsx?|pptx?|jpg|jpeg|png|txt|csv)\.(exe|scr|bat|cmd|js|vbs|ps1)$/i;
const SUSPICIOUS_KEYWORDS = [
  "verify your account",
  "update your password",
  "urgent action",
  "payment pending",
  "reset your password",
  "bank account",
  "wallet",
  "gift card",
  "kyc update",
  "login now",
];

const RAW_FILE_SCAN_LIMIT_MB = Number(process.env.FILE_SCAN_MAX_MB || 8);
export const FILE_SCAN_MAX_MB = Number.isFinite(RAW_FILE_SCAN_LIMIT_MB)
  ? Math.min(Math.max(Math.floor(RAW_FILE_SCAN_LIMIT_MB), 1), 20)
  : 8;
export const FILE_SCAN_MAX_BYTES = FILE_SCAN_MAX_MB * 1024 * 1024;
export const FILE_SCAN_JSON_LIMIT = `${Math.max(12, Math.ceil(FILE_SCAN_MAX_MB * 1.7))}mb`;

const KNOWN_MALICIOUS_HASHES = new Set(
  String(process.env.KNOWN_MALICIOUS_HASHES || "")
    .split(",")
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean)
);

function getFileExtension(fileName) {
  const normalized = String(fileName || "").split(/[\\/]/).pop() || "";
  const lastDot = normalized.lastIndexOf(".");
  return lastDot === -1 ? "" : normalized.slice(lastDot + 1).toLowerCase();
}

function detectFileSignature(buffer) {
  if (buffer.length >= 5 && buffer.subarray(0, 5).toString("latin1") === "%PDF-") {
    return { kind: "pdf", mime: "application/pdf", label: "PDF document" };
  }

  if (buffer.length >= 2 && buffer.subarray(0, 2).toString("latin1") === "MZ") {
    return { kind: "pe", mime: "application/vnd.microsoft.portable-executable", label: "Windows executable" };
  }

  if (buffer.length >= 8 && buffer.subarray(0, 8).equals(Buffer.from([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]))) {
    return { kind: "cfb", mime: "application/vnd.ms-office", label: "Compound Office document" };
  }

  if (buffer.length >= 4 && buffer.subarray(0, 4).equals(Buffer.from([0x50, 0x4b, 0x03, 0x04]))) {
    return { kind: "zip", mime: "application/zip", label: "ZIP or Office Open XML container" };
  }

  if (buffer.length >= 6 && buffer.subarray(0, 6).toString("latin1") === "Rar!\x1A\x07") {
    return { kind: "rar", mime: "application/vnd.rar", label: "RAR archive" };
  }

  if (buffer.length >= 6 && buffer.subarray(0, 6).equals(Buffer.from([0x37, 0x7a, 0xbc, 0xaf, 0x27, 0x1c]))) {
    return { kind: "7z", mime: "application/x-7z-compressed", label: "7z archive" };
  }

  if (buffer.length >= 8 && buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) {
    return { kind: "png", mime: "image/png", label: "PNG image" };
  }

  if (buffer.length >= 3 && buffer.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff]))) {
    return { kind: "jpeg", mime: "image/jpeg", label: "JPEG image" };
  }

  if (buffer.length >= 6) {
    const gifHeader = buffer.subarray(0, 6).toString("latin1");
    if (gifHeader === "GIF87a" || gifHeader === "GIF89a") {
      return { kind: "gif", mime: "image/gif", label: "GIF image" };
    }
  }

  if (looksMostlyText(buffer)) {
    const textSample = buffer.subarray(0, Math.min(buffer.length, 4096)).toString("latin1").toLowerCase();
    if (textSample.includes("<html") || textSample.includes("<!doctype html")) {
      return { kind: "html", mime: "text/html", label: "HTML file" };
    }

    return { kind: "text", mime: "text/plain", label: "Plain text or script file" };
  }

  return { kind: "unknown", mime: "application/octet-stream", label: "Unknown binary file" };
}

function looksMostlyText(buffer) {
  const sample = buffer.subarray(0, Math.min(buffer.length, 4096));
  if (!sample.length) {
    return false;
  }

  let printable = 0;
  let zeroBytes = 0;

  for (const byte of sample) {
    if (byte === 0) {
      zeroBytes += 1;
    }

    if ((byte >= 32 && byte <= 126) || byte === 9 || byte === 10 || byte === 13) {
      printable += 1;
    }
  }

  return zeroBytes === 0 && printable / sample.length >= 0.82;
}

function buildSearchableText(buffer) {
  const previewBytes = 1024 * 1024;

  if (buffer.length <= previewBytes * 2) {
    return buffer.toString("latin1").replace(/\0/g, " ");
  }

  const head = buffer.subarray(0, previewBytes).toString("latin1");
  const tail = buffer.subarray(buffer.length - previewBytes).toString("latin1");
  return `${head}\n${tail}`.replace(/\0/g, " ");
}

function extractUrls(searchableText) {
  const matches = searchableText.match(/(?:https?:\/\/|www\.)[^\s"'<>\\)]+/gi) || [];
  const uniqueUrls = [];
  const seen = new Set();

  for (const match of matches) {
    const cleaned = match.replace(/[),.;]+$/g, "");
    if (cleaned.length < 8) {
      continue;
    }

    const normalized = cleaned.toLowerCase();
    if (seen.has(normalized)) {
      continue;
    }

    seen.add(normalized);
    uniqueUrls.push(cleaned);

    if (uniqueUrls.length >= 20) {
      break;
    }
  }

  return uniqueUrls;
}

function analyzeExtractedUrl(rawUrl) {
  const reasons = [];
  let riskScore = 0;

  try {
    const normalizedUrl = /^https?:\/\//i.test(rawUrl) ? rawUrl : `https://${rawUrl}`;
    const parsedUrl = new URL(normalizedUrl);
    const host = parsedUrl.hostname.toLowerCase();
    const reviewSurface = `${host}${parsedUrl.pathname}`.toLowerCase();

    if (parsedUrl.protocol !== "https:") {
      riskScore += 10;
      reasons.push("Uses HTTP instead of HTTPS.");
    }

    if (/^\d{1,3}(\.\d{1,3}){3}$/.test(host)) {
      riskScore += 20;
      reasons.push("Uses a raw IP address.");
    }

    if (host.includes("xn--")) {
      riskScore += 18;
      reasons.push("Contains punycode characters that can hide lookalike domains.");
    }

    if (rawUrl.includes("@")) {
      riskScore += 14;
      reasons.push("Includes an @ symbol that can disguise the true destination.");
    }

    if (host.split(".").length > 4) {
      riskScore += 8;
      reasons.push("Has many subdomains.");
    }

    if ((host.match(/-/g) || []).length >= 3) {
      riskScore += 8;
      reasons.push("Uses several hyphens, which is common in spoofed hosts.");
    }

    if (/(login|verify|account|secure|update|payment|wallet|bank|password|invoice)/i.test(reviewSurface)) {
      riskScore += 12;
      reasons.push("Contains credential or urgency keywords.");
    }

    if (/(bit\.ly|tinyurl\.com|goo\.gl|t\.co|rb\.gy)/i.test(host)) {
      riskScore += 10;
      reasons.push("Uses a shortened-link domain.");
    }

    return {
      url: rawUrl,
      host,
      riskScore,
      verdict: riskScore >= 25 ? "suspicious" : riskScore > 0 ? "review" : "low-risk",
      reasons,
    };
  } catch {
    return {
      url: rawUrl,
      host: "",
      riskScore: 25,
      verdict: "suspicious",
      reasons: ["The extracted URL could not be parsed cleanly."],
    };
  }
}

function getEntropy(buffer) {
  const sample = buffer.subarray(0, Math.min(buffer.length, 256 * 1024));
  if (!sample.length) {
    return 0;
  }

  const frequencies = new Array(256).fill(0);
  for (const byte of sample) {
    frequencies[byte] += 1;
  }

  let entropy = 0;
  for (const count of frequencies) {
    if (!count) {
      continue;
    }

    const probability = count / sample.length;
    entropy -= probability * Math.log2(probability);
  }

  return Number(entropy.toFixed(2));
}

function getExpectedKinds(extension) {
  if (!extension) {
    return new Set(["unknown"]);
  }

  const map = {
    pdf: new Set(["pdf"]),
    exe: new Set(["pe"]),
    dll: new Set(["pe"]),
    scr: new Set(["pe"]),
    com: new Set(["pe"]),
    msi: new Set(["cfb"]),
    doc: new Set(["cfb"]),
    xls: new Set(["cfb"]),
    ppt: new Set(["cfb"]),
    docx: new Set(["zip"]),
    xlsx: new Set(["zip"]),
    pptx: new Set(["zip"]),
    docm: new Set(["zip"]),
    xlsm: new Set(["zip"]),
    pptm: new Set(["zip"]),
    zip: new Set(["zip"]),
    rar: new Set(["rar"]),
    "7z": new Set(["7z"]),
    png: new Set(["png"]),
    jpg: new Set(["jpeg"]),
    jpeg: new Set(["jpeg"]),
    gif: new Set(["gif"]),
    html: new Set(["html", "text"]),
    htm: new Set(["html", "text"]),
    txt: new Set(["text"]),
    csv: new Set(["text"]),
    js: new Set(["text"]),
    vbs: new Set(["text"]),
    ps1: new Set(["text"]),
    bat: new Set(["text"]),
    cmd: new Set(["text"]),
  };

  return map[extension] || new Set(["unknown", "text"]);
}

function isTypeMismatch(extension, detectedKind) {
  const expectedKinds = getExpectedKinds(extension);
  return !expectedKinds.has(detectedKind) && !expectedKinds.has("unknown");
}

function getSuspiciousKeywords(text) {
  return SUSPICIOUS_KEYWORDS.filter((keyword) => text.toLowerCase().includes(keyword)).slice(0, 6);
}

function getNestedPayloadNames(text) {
  const matches = text.match(/\b[\w./-]+\.(?:exe|dll|scr|js|vbs|ps1|bat|cmd|jar)\b/gi) || [];
  const uniqueNames = [];
  const seen = new Set();

  for (const match of matches) {
    const normalized = match.toLowerCase();
    if (seen.has(normalized)) {
      continue;
    }

    seen.add(normalized);
    uniqueNames.push(match);

    if (uniqueNames.length >= 8) {
      break;
    }
  }

  return uniqueNames;
}

function createFindingCollector() {
  return {
    score: 0,
    reasons: [],
    categories: new Set(),
    seen: new Set(),
  };
}

function addFinding(collector, finding) {
  const key = `${finding.layer}:${finding.title}:${finding.detail}`;
  if (collector.seen.has(key)) {
    return;
  }

  collector.seen.add(key);
  collector.score = Math.min(100, collector.score + finding.points);
  collector.reasons.push(finding);

  if (finding.category) {
    collector.categories.add(finding.category);
  }
}

function getStatusFromScore(score) {
  if (score >= 85) {
    return "Blocked";
  }

  if (score >= 65) {
    return "High risk";
  }

  if (score >= 35) {
    return "Suspicious";
  }

  if (score >= 15) {
    return "Needs review";
  }

  return "No obvious threat";
}

function getRecommendation(score) {
  if (score >= 85) {
    return "Quarantine this file immediately and do not allow it to be opened.";
  }

  if (score >= 65) {
    return "Hold the file for analyst review before anyone opens or forwards it.";
  }

  if (score >= 35) {
    return "Review the flagged indicators manually and treat the file as suspicious until cleared.";
  }

  if (score >= 15) {
    return "Keep normal caution and validate the sender, purpose, and any embedded links.";
  }

  return "No strong indicators were found in this heuristic scan, but the result is not a guarantee of safety.";
}

export function scanUploadedFile({ fileName, declaredMime, declaredSize, buffer }) {
  const extension = getFileExtension(fileName);
  const detectedType = detectFileSignature(buffer);
  const searchableText = buildSearchableText(buffer);
  const sha256 = crypto.createHash("sha256").update(buffer).digest("hex");
  const entropy = getEntropy(buffer);
  const collector = createFindingCollector();
  const suspiciousKeywords = getSuspiciousKeywords(searchableText);
  const extractedUrls = extractUrls(searchableText).map(analyzeExtractedUrl);
  const suspiciousUrls = extractedUrls.filter((entry) => entry.riskScore >= 12);
  const nestedPayloadNames = getNestedPayloadNames(searchableText);
  const hasPdfJavaScript = detectedType.kind === "pdf" && /\/JavaScript|\/JS\b/i.test(searchableText);
  const hasPdfAction = detectedType.kind === "pdf" && /\/OpenAction|\/Launch\b/i.test(searchableText);
  const hasMacroIndicators =
    MACRO_EXTENSIONS.has(extension) ||
    /vbaProject\.bin|macros\/vba|_vba_project/i.test(searchableText);
  const fileNameLower = String(fileName || "").toLowerCase();

  if (!buffer.length) {
    addFinding(collector, {
      layer: "file-validation",
      title: "Empty file",
      detail: "The uploaded file is empty and cannot be trusted.",
      severity: "medium",
      points: 20,
      category: "type-mismatch",
    });
  }

  if (declaredSize && declaredSize !== buffer.length) {
    addFinding(collector, {
      layer: "file-validation",
      title: "Declared size mismatch",
      detail: "The uploaded metadata size does not match the bytes received by the server.",
      severity: "medium",
      points: 10,
      category: "type-mismatch",
    });
  }

  if (KNOWN_MALICIOUS_HASHES.has(sha256)) {
    addFinding(collector, {
      layer: "hash-reputation",
      title: "Known malicious hash match",
      detail: "The file hash matched a locally configured malicious hash blocklist.",
      severity: "high",
      points: 40,
      category: "malware",
    });
  }

  if (DOUBLE_EXTENSION_REGEX.test(fileNameLower)) {
    addFinding(collector, {
      layer: "file-validation",
      title: "Double extension detected",
      detail: "The filename looks disguised with a safe-looking extension followed by an executable or script extension.",
      severity: "high",
      points: 35,
      category: "suspicious-script",
    });
  }

  if (EXECUTABLE_EXTENSIONS.has(extension) || detectedType.kind === "pe") {
    addFinding(collector, {
      layer: "file-validation",
      title: "Executable content detected",
      detail: "The file is an executable format or is carrying executable content.",
      severity: "high",
      points: 35,
      category: "malware",
    });
  }

  if (SCRIPT_EXTENSIONS.has(extension)) {
    addFinding(collector, {
      layer: "file-validation",
      title: "Script file uploaded",
      detail: "Scripts are commonly used to deliver or stage malware.",
      severity: "high",
      points: 28,
      category: "suspicious-script",
    });
  }

  if (isTypeMismatch(extension, detectedType.kind)) {
    addFinding(collector, {
      layer: "file-validation",
      title: "Extension does not match file signature",
      detail: `The file extension suggests .${extension || "unknown"}, but the bytes look like ${detectedType.label.toLowerCase()}.`,
      severity: "high",
      points: 22,
      category: "type-mismatch",
    });
  }

  if (hasMacroIndicators) {
    addFinding(collector, {
      layer: "static-analysis",
      title: "Macro indicators found",
      detail: "The document contains macro-related markers or uses a macro-enabled Office format.",
      severity: "high",
      points: 25,
      category: "phishing-document",
    });
  }

  if (hasPdfJavaScript) {
    addFinding(collector, {
      layer: "static-analysis",
      title: "Embedded PDF JavaScript",
      detail: "The PDF contains JavaScript markers that are commonly abused in malicious documents.",
      severity: "high",
      points: 25,
      category: "phishing-document",
    });
  }

  if (hasPdfAction) {
    addFinding(collector, {
      layer: "static-analysis",
      title: "Automatic PDF action found",
      detail: "The PDF contains launch or open-action markers that deserve manual review.",
      severity: "medium",
      points: 15,
      category: "phishing-document",
    });
  }

  if (ARCHIVE_EXTENSIONS.has(extension) && nestedPayloadNames.length) {
    addFinding(collector, {
      layer: "static-analysis",
      title: "Archive contains executable-looking entries",
      detail: "The archive text preview references nested executable or script files.",
      severity: "high",
      points: 20,
      category: "malware",
    });
  }

  if (suspiciousUrls.length) {
    addFinding(collector, {
      layer: "url-analysis",
      title: "Suspicious URLs extracted",
      detail: `${suspiciousUrls.length} extracted URL${suspiciousUrls.length === 1 ? "" : "s"} showed phishing-style indicators.`,
      severity: suspiciousUrls.some((entry) => entry.riskScore >= 25) ? "high" : "medium",
      points: Math.min(25, 12 + (suspiciousUrls.length - 1) * 6),
      category: "malicious-url",
    });
  }

  if (DOCUMENT_EXTENSIONS.has(extension) && suspiciousKeywords.length >= 2) {
    addFinding(collector, {
      layer: "static-analysis",
      title: "Phishing-style wording found",
      detail: "The document preview includes multiple urgency or account-verification phrases.",
      severity: "medium",
      points: 10,
      category: "phishing-document",
    });
  }

  if (SUSPICIOUS_FILENAME_REGEX.test(fileNameLower) && DOCUMENT_EXTENSIONS.has(extension)) {
    addFinding(collector, {
      layer: "file-validation",
      title: "Suspicious business lure in filename",
      detail: "The filename uses wording frequently seen in phishing attachments.",
      severity: "medium",
      points: 8,
      category: "phishing-document",
    });
  }

  if (entropy >= 7.2 && (EXECUTABLE_EXTENSIONS.has(extension) || SCRIPT_EXTENSIONS.has(extension) || detectedType.kind === "unknown")) {
    addFinding(collector, {
      layer: "static-analysis",
      title: "High-entropy payload",
      detail: "The file bytes are highly random or compressed, which can indicate packing or obfuscation.",
      severity: "medium",
      points: 8,
      category: "malware",
    });
  }

  const riskScore = collector.score;
  const status = getStatusFromScore(riskScore);

  return {
    fileName,
    extension: extension || "unknown",
    sizeBytes: buffer.length,
    declaredMime: declaredMime || "unknown",
    detectedType,
    sha256,
    status,
    riskScore,
    recommendation: getRecommendation(riskScore),
    categories: Array.from(collector.categories),
    reasons: collector.reasons,
    checks: {
      hashReputation: {
        status: KNOWN_MALICIOUS_HASHES.has(sha256) ? "known-malicious" : "no-local-match",
        source: "local-configured-hash-blocklist",
      },
      fileType: {
        detectedLabel: detectedType.label,
        detectedMime: detectedType.mime,
        mismatch: isTypeMismatch(extension, detectedType.kind),
      },
      staticAnalysis: {
        entropy,
        hasMacroIndicators,
        hasPdfJavaScript,
        hasPdfAction,
        suspiciousKeywords,
        nestedPayloadNames,
      },
      urlAnalysis: {
        totalExtracted: extractedUrls.length,
        suspiciousUrls,
      },
    },
    notes: [
      "Files are scanned in memory only and are never executed by the platform.",
      "This result combines rule-based and heuristic checks and should be treated as a risk signal, not a perfect guarantee.",
      "For stronger coverage, add external reputation feeds or a dedicated malware engine behind this API.",
    ],
    scannedAt: new Date().toISOString(),
    engine: "Threat Shield Heuristic File Scanner v1",
  };
}
