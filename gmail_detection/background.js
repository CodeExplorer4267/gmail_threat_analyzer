import { analyzeURL } from "./Analyzer/urlAnalyzer.js";
import { analyzeDomain } from "./Analyzer/domainAnalyzer.js";
import { analyzeAttachment } from "./Analyzer/attachmentAnalyzer.js";

const STORAGE_KEY = "latestEmailData";
const EVENTS_KEY = "threatEvents";
const MAX_EVENTS = 100;

function sanitizeList(values) {
    if (!Array.isArray(values)) {
        return [];
    }

    return [...new Set(values.filter((value) => typeof value === "string" && value.trim().length > 0))];
}

function sanitizeText(value, fallback) {
    return typeof value === "string" && value.trim().length > 0 ? value.trim() : fallback;
}

function extractDomains(urls) {
    const domains = new Set();

    for (const url of urls) {
        try {
            domains.add(new URL(url).hostname);
        } catch {
            // Invalid URLs are already handled by the URL analyzer.
        }
    }

    return [...domains];
}

function getStatusFromAnalyses(urlAnalyses, domainAnalyses, attachmentAnalyses) {
    const verdicts = [...urlAnalyses, ...domainAnalyses, ...attachmentAnalyses].map((item) => item.verdict);

    if (verdicts.some((verdict) => verdict === "Risky" || verdict === "Malicious")) {
        return "danger";
    }

    if (verdicts.some((verdict) => verdict === "Suspicious" || verdict === "Caution" || verdict === "Invalid")) {
        return "warn";
    }

    return "safe";
}

function buildPrimaryFinding(urlAnalyses, domainAnalyses, attachmentAnalyses) {
    const prioritized = [...attachmentAnalyses, ...domainAnalyses, ...urlAnalyses].find((item) =>
        item.verdict !== "Clean" && item.verdict !== "Safe"
    );

    if (!prioritized) {
        return "No malicious indicators detected";
    }

    if (prioritized.reasons?.length) {
        return prioritized.reasons[0];
    }

    return `${prioritized.verdict} indicator detected`;
}

function createEventRecord(payload, sourceTabId) {
    const urls = sanitizeList(payload.urls);
    const attachments = sanitizeList(payload.attachments);
    const domains = extractDomains(urls);
    const urlAnalyses = urls.map((url) => analyzeURL(url));
    const domainAnalyses = domains.map((domain) => analyzeDomain(domain));
    const attachmentAnalyses = attachments.map((file) => analyzeAttachment(file));
    const updatedAt = new Date().toISOString();

    return {
        id: sanitizeText(payload.threadId, `${sanitizeText(payload.sender, "unknown")}::${sanitizeText(payload.subject, "untitled")}`),
        threadId: sanitizeText(payload.threadId, "unknown-thread"),
        subject: sanitizeText(payload.subject, "Untitled email"),
        sender: sanitizeText(payload.sender, "Unknown sender"),
        urls,
        domains,
        attachments,
        urlAnalyses,
        domainAnalyses,
        attachmentAnalyses,
        status: getStatusFromAnalyses(urlAnalyses, domainAnalyses, attachmentAnalyses),
        finding: buildPrimaryFinding(urlAnalyses, domainAnalyses, attachmentAnalyses),
        updatedAt,
        sourceTabId
    };
}

chrome.runtime.onInstalled.addListener(() => {
    chrome.storage.local.get([STORAGE_KEY, EVENTS_KEY], (result) => {
        chrome.storage.local.set({
            [STORAGE_KEY]: result[STORAGE_KEY] ?? {
                urls: [],
                domains: [],
                attachments: [],
                subject: "",
                sender: "",
                updatedAt: null
            },
            [EVENTS_KEY]: Array.isArray(result[EVENTS_KEY]) ? result[EVENTS_KEY] : []
        });
    });
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === "EMAIL_DATA") {
        const eventRecord = createEventRecord(message, sender.tab?.id ?? null);
        const latestPayload = {
            subject: eventRecord.subject,
            sender: eventRecord.sender,
            threadId: eventRecord.threadId,
            urls: eventRecord.urls,
            domains: eventRecord.domains,
            attachments: eventRecord.attachments,
            updatedAt: eventRecord.updatedAt,
            status: eventRecord.status,
            finding: eventRecord.finding
        };

        chrome.storage.local.get(EVENTS_KEY, (result) => {
            const existingEvents = Array.isArray(result[EVENTS_KEY]) ? result[EVENTS_KEY] : [];
            const filteredEvents = existingEvents.filter((item) => item.id !== eventRecord.id);
            const updatedEvents = [eventRecord, ...filteredEvents].slice(0, MAX_EVENTS);

            chrome.storage.local.set({
                [STORAGE_KEY]: latestPayload,
                [EVENTS_KEY]: updatedEvents
            }, () => {
                if (chrome.runtime.lastError) {
                    sendResponse({
                        ok: false,
                        error: chrome.runtime.lastError.message
                    });
                    return;
                }

                sendResponse({
                    ok: true,
                    event: eventRecord
                });
            });
        });

        return true;
    }

    if (message.type === "GET_EMAIL_DATA") {
        chrome.storage.local.get(STORAGE_KEY, (result) => {
            if (chrome.runtime.lastError) {
                sendResponse({
                    urls: [],
                    domains: [],
                    attachments: [],
                    updatedAt: null,
                    error: chrome.runtime.lastError.message
                });
                return;
            }

            sendResponse(result[STORAGE_KEY] ?? {
                urls: [],
                domains: [],
                attachments: [],
                updatedAt: null
            });
        });

        return true;
    }

    if (message.type === "GET_DASHBOARD_DATA") {
        chrome.storage.local.get([EVENTS_KEY, STORAGE_KEY], (result) => {
            sendResponse({
                threatEvents: Array.isArray(result[EVENTS_KEY]) ? result[EVENTS_KEY] : [],
                latestEmailData: result[STORAGE_KEY] ?? null
            });
        });

        return true;
    }

    return false;
});
