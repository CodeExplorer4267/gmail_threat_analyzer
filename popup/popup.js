import { analyzeURL } from "../Analyzer/urlAnalyzer.js";
import { analyzeDomain } from "../Analyzer/domainAnalyzer.js";
import { analyzeAttachment } from "../Analyzer/attachmentAnalyzer.js";

const urlCount = document.getElementById("urlCount");
const domainCount = document.getElementById("domainCount");
const attachCount = document.getElementById("attachCount");
const syncLabel = document.getElementById("syncLabel");
const result = document.getElementById("result");
const domainBtn = document.getElementById("domainBtn");
const urlBtn = document.getElementById("urlBtn");
const attachBtn = document.getElementById("attachBtn");

let currentData = {
    urls: [],
    attachments: [],
    updatedAt: null
};
let currentView = "overview";

function escapeHtml(value) {
    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

function extractUniqueDomains(urls) {
    const domains = new Set();

    for (const url of urls) {
        try {
            domains.add(new URL(url).hostname);
        } catch {
            // Ignore bad URLs already handled by the URL analyzer.
        }
    }

    return [...domains];
}

function setActiveButton(activeButton) {
    [domainBtn, urlBtn, attachBtn].forEach((button) => {
        button.classList.toggle("is-active", button === activeButton);
    });
}

function getToneClass(verdict) {
    if (["Clean", "Safe"].includes(verdict)) {
        return "safe";
    }

    if (["Suspicious", "Caution", "Invalid"].includes(verdict)) {
        return "warn";
    }

    return "danger";
}

function formatTimestamp(value) {
    if (!value) {
        return "No Gmail message synced yet.";
    }

    return `Last synced ${new Date(value).toLocaleString()}`;
}

function buildSummaryMetrics(analyses) {
    const summary = {
        safe: 0,
        warn: 0,
        danger: 0,
        averageRisk: 0
    };

    for (const analysis of analyses) {
        const tone = getToneClass(analysis.verdict);
        summary[tone] += 1;
        summary.averageRisk += analysis.riskScore || 0;
    }

    if (analyses.length > 0) {
        summary.averageRisk = Math.round(summary.averageRisk / analyses.length);
    }

    return summary;
}

function renderMetricBoxes(metrics) {
    return `
        <div class="metric-grid">
            ${metrics.map((metric) => `
                <div class="metric-box ${metric.tone}">
                    <strong>${escapeHtml(metric.value)}</strong>
                    <span>${escapeHtml(metric.label)}</span>
                </div>
            `).join("")}
        </div>
    `;
}

function renderFactRows(facts) {
    return `
        <div class="fact-list">
            ${facts.map((fact) => `
                <div class="fact-row">
                    <span class="fact-label">${escapeHtml(fact.label)}:</span>
                    <span>${escapeHtml(fact.value)}</span>
                </div>
            `).join("")}
        </div>
    `;
}

function renderList(items) {
    return `
        <ul class="detail-list">
            ${items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}
        </ul>
    `;
}

function renderChips(items) {
    return `
        <div class="chip-row">
            ${items.map((item) => `<span class="chip">${escapeHtml(item)}</span>`).join("")}
        </div>
    `;
}

function renderReportCard(analysis) {
    const tone = getToneClass(analysis.verdict);

    return `
        <article class="report-card">
            <div class="report-head">
                <div>
                    <h3 class="report-title">${escapeHtml(analysis.title)}</h3>
                    <p class="report-subtitle">${escapeHtml(analysis.summaryLine)}</p>
                </div>
                <div class="score-pill ${tone}">${escapeHtml(analysis.scoreLabel)}</div>
            </div>

            <div class="target-box">
                <code>${escapeHtml(analysis.target)}</code>
                <button class="copy-btn" data-copy="${escapeHtml(analysis.target)}">Copy</button>
            </div>

            ${renderFactRows(analysis.facts)}
            ${renderMetricBoxes(analysis.metrics)}

            <section class="section">
                <h4>${escapeHtml(analysis.assessmentTitle)}</h4>
                <div class="assessment-box">${escapeHtml(analysis.assessment)}</div>
            </section>

            <section class="section">
                <h4>${escapeHtml(analysis.detailTitle)}</h4>
                ${renderList(analysis.detailBullets)}
            </section>

            <section class="section">
                <h4>${escapeHtml(analysis.signalTitle)}</h4>
                ${renderChips(analysis.signals)}
            </section>

            <section class="section">
                <h4>${escapeHtml(analysis.narrativeTitle)}</h4>
                ${renderList(analysis.narrative)}
            </section>
        </article>
    `;
}

function renderSummaryCard(title, analyses, noun) {
    const summary = buildSummaryMetrics(analyses);
    const primaryLine = summary.danger > 0
        ? `<strong>Attention needed:</strong> ${summary.danger} ${noun} ${summary.danger === 1 ? "shows" : "show"} high-risk indicators.`
        : summary.warn > 0
            ? `<strong>Manual review:</strong> ${summary.warn} ${noun} ${summary.warn === 1 ? "needs" : "need"} closer inspection.`
            : `<strong>Clean profile:</strong> ${analyses.length} ${noun} ${analyses.length === 1 ? "passed" : "passed"} the current local checks.`;

    return `
        <section class="summary-card">
            <p class="summary-kicker">Detailed Summary</p>
            <h2 class="summary-title">${escapeHtml(title)}</h2>
            <p class="summary-line">${primaryLine}</p>
            <div class="summary-grid">
                <div class="metric-box safe">
                    <strong>${summary.safe}</strong>
                    <span>Clean</span>
                </div>
                <div class="metric-box warn">
                    <strong>${summary.warn}</strong>
                    <span>Review</span>
                </div>
                <div class="metric-box danger">
                    <strong>${summary.danger}</strong>
                    <span>Risky</span>
                </div>
                <div class="metric-box neutral">
                    <strong>${summary.averageRisk}</strong>
                    <span>Avg. Risk</span>
                </div>
            </div>
        </section>
    `;
}

function renderThreatReport(title, analyses, emptyMessage, noun) {
    if (analyses.length === 0) {
        result.innerHTML = `<p class="empty">${escapeHtml(emptyMessage)}</p>`;
        return;
    }

    result.innerHTML = `${renderSummaryCard(title, analyses, noun)}${analyses.map(renderReportCard).join("")}`;
}

function renderAttachmentReport() {
    currentView = "attachments";

    if (currentData.attachments.length === 0) {
        result.innerHTML = `<p class="empty">No attachments found in the current Gmail message.</p>`;
        return;
    }

    const analyses = currentData.attachments.map((file) => analyzeAttachment(file));
    const summary = analyses.reduce((accumulator, analysis) => {
        const tone = getToneClass(analysis.verdict);
        accumulator[tone] += 1;
        return accumulator;
    }, { safe: 0, warn: 0, danger: 0 });

    result.innerHTML = `
        <section class="summary-card">
            <p class="summary-kicker">Attachment Summary</p>
            <h2 class="summary-title">Attachment Analysis</h2>
            <p class="summary-line"><strong>${summary.danger > 0 ? "Warning:" : "Review ready:"}</strong> ${currentData.attachments.length} attachment${currentData.attachments.length === 1 ? "" : "s"} reviewed from the current message.</p>
            <div class="summary-grid">
                <div class="metric-box safe"><strong>${summary.safe}</strong><span>Safe</span></div>
                <div class="metric-box warn"><strong>${summary.warn}</strong><span>Caution</span></div>
                <div class="metric-box danger"><strong>${summary.danger}</strong><span>Malicious</span></div>
                <div class="metric-box neutral"><strong>${currentData.attachments.length}</strong><span>Total</span></div>
            </div>
        </section>
        <section class="attachment-stack">
            ${analyses.map((analysis) => `
                <article class="attachment-card">
                    <div class="report-head">
                        <div>
                            <h3 class="report-title">${escapeHtml(analysis.target)}</h3>
                            <p class="report-subtitle">Attachment verdict: ${escapeHtml(analysis.verdict)}</p>
                        </div>
                        <div class="score-pill ${getToneClass(analysis.verdict)}">${escapeHtml(analysis.verdict)}</div>
                    </div>
                    <p class="attachment-reasons">${analysis.reasons.map((reason) => escapeHtml(reason)).join(" | ")}</p>
                </article>
            `).join("")}
        </section>
    `;
}

function renderOverview() {
    currentView = "overview";
    setActiveButton(null);

    const domains = extractUniqueDomains(currentData.urls);
    const messageState = currentData.urls.length === 0 && currentData.attachments.length === 0
        ? "No URLs or attachments are visible in the current message yet."
        : `The current message contains ${currentData.urls.length} URL${currentData.urls.length === 1 ? "" : "s"}, ${domains.length} domain${domains.length === 1 ? "" : "s"}, and ${currentData.attachments.length} attachment${currentData.attachments.length === 1 ? "" : "s"}.`;

    result.innerHTML = `
        <section class="overview-card">
            <h2 class="overview-title">Message Overview</h2>
            <p class="overview-copy">${escapeHtml(messageState)}</p>
            <p class="overview-copy">${escapeHtml(formatTimestamp(currentData.updatedAt))}</p>
            <p class="overview-copy">Choose a report above to open a deeper review for domain reputation, URL structure, or attachment risk.</p>
        </section>
    `;
}

function rerenderCurrentView() {
    if (currentView === "domains") {
        setActiveButton(domainBtn);
        renderThreatReport(
            "Domain Analysis Details",
            extractUniqueDomains(currentData.urls).map((domain) => analyzeDomain(domain)),
            "No domains found in the current Gmail message.",
            "domains"
        );
        return;
    }

    if (currentView === "urls") {
        setActiveButton(urlBtn);
        renderThreatReport(
            `All URLs (${currentData.urls.length})`,
            currentData.urls.map((url) => analyzeURL(url)),
            "No URLs found in the current Gmail message.",
            "URLs"
        );
        return;
    }

    if (currentView === "attachments") {
        setActiveButton(attachBtn);
        renderAttachmentReport();
        return;
    }

    renderOverview();
}

function updateOverviewStats() {
    const domains = extractUniqueDomains(currentData.urls);
    urlCount.textContent = String(currentData.urls.length);
    domainCount.textContent = String(domains.length);
    attachCount.textContent = String(currentData.attachments.length);
    syncLabel.textContent = formatTimestamp(currentData.updatedAt);
}

function loadEmailData() {
    chrome.runtime.sendMessage({ type: "GET_EMAIL_DATA" }, (response) => {
        if (chrome.runtime.lastError || !response) {
            syncLabel.textContent = "Unable to load Gmail data.";
            result.innerHTML = `<p class="empty">Unable to load captured Gmail data.</p>`;
            return;
        }

        currentData = {
            urls: Array.isArray(response.urls) ? response.urls : [],
            attachments: Array.isArray(response.attachments) ? response.attachments : [],
            updatedAt: response.updatedAt || null
        };

        updateOverviewStats();
        rerenderCurrentView();
    });
}

function refreshCounts(data) {
    currentData = {
        urls: Array.isArray(data.urls) ? data.urls : [],
        attachments: Array.isArray(data.attachments) ? data.attachments : [],
        updatedAt: data.updatedAt || new Date().toISOString()
    };

    updateOverviewStats();
    rerenderCurrentView();
}

function requestActiveTabData() {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (chrome.runtime.lastError || !tabs?.length) {
            loadEmailData();
            return;
        }

        const [tab] = tabs;

        if (!tab.id || !tab.url || !tab.url.startsWith("https://mail.google.com/")) {
            loadEmailData();
            return;
        }

        const requestData = () => {
            chrome.tabs.sendMessage(tab.id, { type: "EXTRACT_EMAIL_DATA" }, (response) => {
                if (chrome.runtime.lastError || !response?.ok) {
                    loadEmailData();
                    return;
                }

                refreshCounts(response);
            });
        };

        chrome.tabs.sendMessage(tab.id, { type: "EXTRACT_EMAIL_DATA" }, (response) => {
            if (!chrome.runtime.lastError && response?.ok) {
                refreshCounts(response);
                return;
            }

            chrome.scripting.executeScript({
                target: { tabId: tab.id },
                files: ["content.js"]
            }, () => {
                if (chrome.runtime.lastError) {
                    loadEmailData();
                    return;
                }

                window.setTimeout(requestData, 300);
            });
        });
    });
}

chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName !== "local" || !changes.latestEmailData?.newValue) {
        return;
    }

    refreshCounts(changes.latestEmailData.newValue);
});

result.addEventListener("click", async(event) => {
    const button = event.target.closest(".copy-btn");

    if (!button) {
        return;
    }

    const value = button.dataset.copy || "";

    try {
        await navigator.clipboard.writeText(value);
        button.textContent = "Copied";
        window.setTimeout(() => {
            button.textContent = "Copy";
        }, 1200);
    } catch {
        button.textContent = "Failed";
        window.setTimeout(() => {
            button.textContent = "Copy";
        }, 1200);
    }
});

domainBtn.addEventListener("click", () => {
    currentView = "domains";
    setActiveButton(domainBtn);
    renderThreatReport(
        "Domain Analysis Details",
        extractUniqueDomains(currentData.urls).map((domain) => analyzeDomain(domain)),
        "No domains found in the current Gmail message.",
        "domains"
    );
});

urlBtn.addEventListener("click", () => {
    currentView = "urls";
    setActiveButton(urlBtn);
    renderThreatReport(
        `All URLs (${currentData.urls.length})`,
        currentData.urls.map((url) => analyzeURL(url)),
        "No URLs found in the current Gmail message.",
        "URLs"
    );
});

attachBtn.addEventListener("click", () => {
    setActiveButton(attachBtn);
    renderAttachmentReport();
});

requestActiveTabData();
