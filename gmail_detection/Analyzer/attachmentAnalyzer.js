const dangerousExtensions = [
    ".exe",
    ".js",
    ".bat",
    ".scr",
    ".cmd",
    ".msi",
    ".ps1",
    ".vbs"
];

const cautionExtensions = [
    ".docm",
    ".xlsm",
    ".pptm",
    ".zip",
    ".rar",
    ".7z"
];

export function analyzeAttachment(file) {
    const normalized = file.toLowerCase().trim();
    const reasons = [];

    if (dangerousExtensions.some((ext) => normalized.endsWith(ext))) {
        reasons.push("Executable or script attachment");
    }

    if (cautionExtensions.some((ext) => normalized.endsWith(ext))) {
        reasons.push("Archive or macro-enabled attachment");
    }

    if (/\.[a-z0-9]+\.(exe|js|scr|bat)$/i.test(normalized)) {
        reasons.push("Double extension detected");
    }

    let verdict = "Safe";

    if (reasons.some((reason) => reason.includes("Executable") || reason.includes("Double extension"))) {
        verdict = "Malicious";
    } else if (reasons.length > 0) {
        verdict = "Caution";
    }

    return {
        target: file,
        verdict,
        reasons: reasons.length > 0 ? reasons : ["No obvious attachment indicators found"]
    };
}
