const EVENTS_KEY = "threatEvents";
const LATEST_KEY = "latestEmailData";

const metricScans = document.getElementById("metricScans");
const metricThreats = document.getElementById("metricThreats");
const metricWrites = document.getElementById("metricWrites");
const metricViewers = document.getElementById("metricViewers");
const heroThreatScore = document.getElementById("heroThreatScore");
const heroScans = document.getElementById("heroScans");
const heroLastSync = document.getElementById("heroLastSync");
const statusScan = document.getElementById("statusScan");
const statusFeed = document.getElementById("statusFeed");
const statusStore = document.getElementById("statusStore");
const pipelineHealth = document.getElementById("pipelineHealth");
const threatTable = document.getElementById("threatTable");
const investigationQueue = document.getElementById("investigationQueue");
const storageCards = document.getElementById("storageCards");
const activityTimeline = document.getElementById("activityTimeline");
const filters = [...document.querySelectorAll(".filter")];

let activeFilter = "all";
let currentEvents = [];
let latestEmailData = null;

function formatNumber(value) {
    return new Intl.NumberFormat("en-US").format(value);
}

function escapeHtml(value) {
    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

function statusLabel(status) {
    if (status === "danger") {
        return "High Risk";
    }

    if (status === "warn") {
        return "Needs Review";
    }

    return "Clean";
}

function formatRelativeTime(value) {
    if (!value) {
        return "No sync yet";
    }

    const seconds = Math.max(Math.floor((Date.now() - new Date(value).getTime()) / 1000), 0);

    if (seconds < 60) {
        return `${seconds}s ago`;
    }

    if (seconds < 3600) {
        return `${Math.floor(seconds / 60)} min ago`;
    }

    if (seconds < 86400) {
        return `${Math.floor(seconds / 3600)} hr ago`;
    }

    return `${Math.floor(seconds / 86400)} day ago`;
}

function getChromeStorage() {
    return typeof chrome !== "undefined" && chrome.storage?.local ? chrome.storage.local : null;
}

function countUniqueDomains(events) {
    return new Set(events.flatMap((event) => event.domains || [])).size;
}

function getThreatCount(events) {
    return events.filter((event) => event.status !== "safe").length;
}

function getDangerCount(events) {
    return events.filter((event) => event.status === "danger").length;
}

function getPercent(value, total) {
    if (!total) {
        return 0;
    }

    return Math.round((value / total) * 100);
}

function renderSummary(events, latest) {
    const uniqueDomains = countUniqueDomains(events);
    const threatCount = getThreatCount(events);
    const highPriorityCount = getDangerCount(events);

    metricScans.textContent = formatNumber(events.length);
    metricThreats.textContent = formatNumber(threatCount);
    metricWrites.textContent = formatNumber(events.length);
    metricViewers.textContent = formatNumber(uniqueDomains);
    heroThreatScore.textContent = String(highPriorityCount).padStart(2, "0");
    heroScans.textContent = formatNumber(events.length);
    heroLastSync.textContent = latest?.updatedAt ? formatRelativeTime(latest.updatedAt) : "Waiting";

    statusScan.textContent = events.length > 0
        ? `${events.length} analyzed email${events.length === 1 ? "" : "s"} captured`
        : "Waiting for scan data";
    statusFeed.textContent = threatCount > 0
        ? `${threatCount} threat event${threatCount === 1 ? "" : "s"} available`
        : "No threat records yet";
    statusStore.textContent = events.length > 0
        ? `${events.length} record${events.length === 1 ? "" : "s"} stored for dashboard use`
        : "Storage not populated yet";
}

function renderBars(events) {
    const total = events.length;
    const clean = getPercent(events.filter((event) => event.status === "safe").length, total);
    const suspiciousUrls = getPercent(events.filter((event) =>
        (event.urlAnalyses || []).some((item) => item.verdict === "Suspicious" || item.verdict === "Risky" || item.verdict === "Invalid")
    ).length, total);
    const riskyDomains = getPercent(events.filter((event) =>
        (event.domainAnalyses || []).some((item) => item.verdict === "Suspicious" || item.verdict === "Risky")
    ).length, total);
    const maliciousAttachments = getPercent(events.filter((event) =>
        (event.attachmentAnalyses || []).some((item) => item.verdict === "Malicious" || item.verdict === "Caution")
    ).length, total);

    const mappings = [
        ["barClean", "barCleanLabel", clean],
        ["barUrls", "barUrlsLabel", suspiciousUrls],
        ["barDomains", "barDomainsLabel", riskyDomains],
        ["barAttachments", "barAttachmentsLabel", maliciousAttachments]
    ];

    for (const [barId, labelId, value] of mappings) {
        document.getElementById(barId).style.width = `${value}%`;
        document.getElementById(labelId).textContent = `${value}%`;
    }
}

function buildPipeline(events, latest) {
    return [
        {
            title: "Gmail Extension Scanner",
            status: events.length > 0 ? "safe" : "warn",
            metric: `${formatNumber(events.length)} email record${events.length === 1 ? "" : "s"} captured`,
            copy: events.length > 0
                ? `Latest analyzed subject: ${latest?.subject || "unknown subject"}.`
                : "No analyzed email has been received from the extension yet."
        },
        {
            title: "Threat Detection Results",
            status: getThreatCount(events) > 0 ? "warn" : "safe",
            metric: `${formatNumber(getThreatCount(events))} record${getThreatCount(events) === 1 ? "" : "s"} flagged`,
            copy: getThreatCount(events) > 0
                ? "The dashboard is receiving real verdicts from URL, domain, and attachment analysis."
                : "No suspicious or high-risk events are currently stored."
        },
        {
            title: "Backend Ingestion",
            status: latest?.updatedAt ? "safe" : "warn",
            metric: latest?.updatedAt ? `Last update ${formatRelativeTime(latest.updatedAt)}` : "Awaiting first event",
            copy: latest?.updatedAt
                ? `Most recent sender: ${latest.sender || "unknown sender"}.`
                : "The ingestion layer has not received an analyzed record yet."
        },
        {
            title: "Firestore Storage Readiness",
            status: events.length > 0 ? "safe" : "warn",
            metric: `${formatNumber(events.length)} persisted-style dashboard record${events.length === 1 ? "" : "s"}`,
            copy: "These records are coming from live extension storage and can later be mirrored to Firestore."
        },
        {
            title: "Admin Dashboard Feed",
            status: "safe",
            metric: `${formatNumber(countUniqueDomains(events))} unique domain${countUniqueDomains(events) === 1 ? "" : "s"} loaded`,
            copy: "The admin panel is now showing real analyzed emails instead of mock data."
        }
    ];
}

function renderPipeline(events, latest) {
    const pipeline = buildPipeline(events, latest);

    pipelineHealth.innerHTML = pipeline.map((item) => `
        <article class="pipeline-item">
            <div class="pipeline-top">
                <span class="pipeline-title">${escapeHtml(item.title)}</span>
                <span class="pill ${item.status}">${statusLabel(item.status)}</span>
            </div>
            <p class="pipeline-meta"><strong>${escapeHtml(item.metric)}</strong></p>
            <p class="pipeline-meta">${escapeHtml(item.copy)}</p>
        </article>
    `).join("");
}

function renderThreatTable(events, filter = "all") {
    const rows = events
        .filter((row) => filter === "all" ? true : row.status === filter)
        .map((row) => `
            <tr>
                <td>${escapeHtml(row.subject)}</td>
                <td>${escapeHtml(row.sender)}</td>
                <td>${escapeHtml(row.finding)}</td>
                <td><span class="status-chip ${row.status}">${statusLabel(row.status)}</span></td>
                <td>${escapeHtml(formatRelativeTime(row.updatedAt))}</td>
            </tr>
        `)
        .join("");

    threatTable.innerHTML = rows || `
        <tr>
            <td colspan="5">No analyzed emails match the selected filter yet.</td>
        </tr>
    `;
}

function renderQueue(events) {
    const queueItems = events
        .filter((event) => event.status !== "safe")
        .slice(0, 3);

    if (queueItems.length === 0) {
        investigationQueue.innerHTML = `
            <article class="queue-item">
                <div class="queue-top">
                    <span class="queue-title">No active investigations</span>
                    <span class="pill safe">Clean</span>
                </div>
                <p class="queue-copy">Analyze a Gmail message in the extension and new review items will appear here.</p>
            </article>
        `;
        return;
    }

    investigationQueue.innerHTML = queueItems.map((item) => `
        <article class="queue-item">
            <div class="queue-top">
                <span class="queue-title">${escapeHtml(item.subject)}</span>
                <span class="pill ${item.status}">${statusLabel(item.status)}</span>
            </div>
            <p class="queue-copy">${escapeHtml(item.finding)}</p>
        </article>
    `).join("");
}

function renderStorage(events) {
    const totalUrls = events.reduce((sum, event) => sum + (event.urls?.length || 0), 0);
    const totalDomains = events.reduce((sum, event) => sum + (event.domains?.length || 0), 0);
    const totalAttachments = events.reduce((sum, event) => sum + (event.attachments?.length || 0), 0);
    const cards = [
        {
            title: "threat_events",
            metric: `${formatNumber(events.length)} docs`,
            copy: "Message-level records captured from the extension."
        },
        {
            title: "url_indicators",
            metric: `${formatNumber(totalUrls)} docs`,
            copy: "Total URLs observed across analyzed Gmail messages."
        },
        {
            title: "domain_indicators",
            metric: `${formatNumber(totalDomains)} docs`,
            copy: "Distinct domain analysis entries currently available."
        },
        {
            title: "attachment_indicators",
            metric: `${formatNumber(totalAttachments)} docs`,
            copy: "Attachment findings extracted from scanned emails."
        }
    ];

    storageCards.innerHTML = cards.map((item) => `
        <article class="storage-card">
            <div class="storage-top">
                <span class="storage-title">${escapeHtml(item.title)}</span>
                <span class="pill safe">${escapeHtml(item.metric)}</span>
            </div>
            <p class="storage-copy">${escapeHtml(item.copy)}</p>
        </article>
    `).join("");
}

function renderActivity(events) {
    const recentEvents = events.slice(0, 4);

    if (recentEvents.length === 0) {
        activityTimeline.innerHTML = `
            <article class="timeline-item">
                <div class="timeline-top">
                    <span class="timeline-title">No admin activity yet</span>
                    <span class="pill warn">Waiting</span>
                </div>
                <p class="timeline-copy">Analyze a Gmail message to generate the first dashboard activity record.</p>
            </article>
        `;
        return;
    }

    activityTimeline.innerHTML = recentEvents.map((item) => `
        <article class="timeline-item">
            <div class="timeline-top">
                <span class="timeline-title">${escapeHtml(item.subject)}</span>
                <span class="pill warn">${escapeHtml(formatRelativeTime(item.updatedAt))}</span>
            </div>
            <p class="timeline-copy">${escapeHtml(item.finding)}</p>
        </article>
    `).join("");
}

function renderDashboard(events, latest) {
    currentEvents = Array.isArray(events) ? events : [];
    latestEmailData = latest || null;

    renderSummary(currentEvents, latestEmailData);
    renderBars(currentEvents);
    renderPipeline(currentEvents, latestEmailData);
    renderThreatTable(currentEvents, activeFilter);
    renderQueue(currentEvents);
    renderStorage(currentEvents);
    renderActivity(currentEvents);
}

function loadDashboardData() {
    const storage = getChromeStorage();

    if (!storage) {
        renderDashboard([], null);
        statusScan.textContent = "Open this page from the extension, not as a local file";
        statusFeed.textContent = "chrome.storage.local is unavailable outside the extension";
        statusStore.textContent = "No live dashboard source detected";
        heroLastSync.textContent = "Unavailable";
        return;
    }

    storage.get([EVENTS_KEY, LATEST_KEY], (result) => {
        renderDashboard(
            Array.isArray(result[EVENTS_KEY]) ? result[EVENTS_KEY] : [],
            result[LATEST_KEY] ?? null
        );
    });
}

for (const filterButton of filters) {
    filterButton.addEventListener("click", () => {
        filters.forEach((button) => button.classList.remove("is-active"));
        filterButton.classList.add("is-active");
        activeFilter = filterButton.dataset.filter;
        renderThreatTable(currentEvents, activeFilter);
    });
}

if (typeof chrome !== "undefined" && chrome.storage?.onChanged) {
    chrome.storage.onChanged.addListener((changes, areaName) => {
        if (areaName !== "local") {
            return;
        }

        const nextEvents = changes[EVENTS_KEY]?.newValue ?? currentEvents;
        const nextLatest = changes[LATEST_KEY]?.newValue ?? latestEmailData;
        renderDashboard(Array.isArray(nextEvents) ? nextEvents : [], nextLatest || null);
    });
}

loadDashboardData();
