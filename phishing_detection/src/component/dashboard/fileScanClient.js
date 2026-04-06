const API_BASE = "/api";
export const FILE_SCAN_UI_MAX_MB = 8;

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      const result = String(reader.result || "");
      const [, base64Data = ""] = result.split(",");
      resolve(base64Data);
    };

    reader.onerror = () => {
      reject(new Error(`Failed to read ${file.name}.`));
    };

    reader.readAsDataURL(file);
  });
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
    throw new Error(payload.message || "The scan request failed.");
  }

  return payload;
}

export async function scanFileWithBackend(file) {
  const base64Data = await fileToBase64(file);

  return apiRequest("/files/scan", {
    method: "POST",
    body: JSON.stringify({
      fileName: file.name,
      mimeType: file.type,
      fileSize: file.size,
      base64Data,
    }),
  });
}

export function formatFileSize(bytes) {
  if (bytes >= 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  }

  if (bytes >= 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${bytes} B`;
}

export function getStatusClasses(status) {
  if (status === "Blocked") {
    return "border border-rose-300/20 bg-rose-500/10 text-rose-100";
  }

  if (status === "High risk") {
    return "border border-orange-300/20 bg-orange-500/10 text-orange-100";
  }

  if (status === "Suspicious" || status === "Needs review") {
    return "border border-amber-300/20 bg-amber-500/10 text-amber-100";
  }

  return "border border-emerald-300/20 bg-emerald-500/10 text-emerald-100";
}
