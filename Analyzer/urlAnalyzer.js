const suspiciousWords = [
    "login",
    "verify",
    "bank",
    "secure",
    "update",
    "password",
    "wallet",
    "invoice"
];

const knownShorteners = new Set([
    "bit.ly",
    "tinyurl.com",
    "goo.gl",
    "t.co"
]);

const ipAddressPattern = /^(\d{1,3}\.){3}\d{1,3}$/;

function buildMetrics(totalChecks, severeSignals, reviewSignals) {
    const failedChecks = severeSignals + reviewSignals;
    const passedChecks = Math.max(totalChecks - failedChecks, 0);

    return [
        { label: "Passed checks", value: passedChecks, tone: "safe" },
        { label: "High-risk signals", value: severeSignals, tone: "danger" },
        { label: "Review signals", value: reviewSignals, tone: "warn" },
        { label: "Remaining", value: Math.max(totalChecks - passedChecks - failedChecks, 0), tone: "neutral" }
    ];
}

function getConfidenceLevel(totalChecks, severeSignals) {
    if (severeSignals >= 2) {
        return "Medium";
    }

    return totalChecks >= 8 ? "High" : "Medium";
}

function buildAssessment(verdict, reasons, parsed) {
    if (verdict === "Invalid") {
        return "This entry could not be parsed as a valid URL, so it should be treated with caution until the raw value is verified.";
    }

    if (verdict === "Risky") {
        return `This URL shows multiple strong phishing or delivery indicators around ${parsed.hostname}. Avoid opening it unless the sender and destination are independently confirmed.`;
    }

    if (verdict === "Suspicious") {
        return `This URL is not immediately malicious, but it does include patterns that deserve manual review before it is trusted.`;
    }

    return `This URL looks low risk under the current local checks. No obvious phishing, redirect, or obfuscation indicators were detected.`;
}

function buildNarrative(parsed, reasons, protocolStatus, subdomainCount, queryParamCount) {
    const bullets = [
        `Hostname reviewed: ${parsed.hostname}`,
        `Transport security: ${protocolStatus}`,
        `Path depth: ${parsed.pathname.split("/").filter(Boolean).length || 0}, query parameters: ${queryParamCount}`
    ];

    if (subdomainCount > 0) {
        bullets.push(`Subdomain depth is ${subdomainCount}, which is ${subdomainCount >= 3 ? "deeper than usual" : "within a normal range"} for most user-facing links.`);
    }

    if (reasons.length > 0) {
        bullets.push(`Primary review focus: ${reasons[0]}.`);
    } else {
        bullets.push("The visible structure is straightforward and does not show common lure keywords or redirection tricks.");
    }

    return bullets;
}

export function analyzeURL(url) {
    const totalChecks = 9;

    try {
        const parsed = new URL(url);
        const normalized = `${parsed.hostname}${parsed.pathname}${parsed.search}`.toLowerCase();
        const queryParamCount = [...parsed.searchParams.keys()].length;
        const subdomainCount = Math.max(parsed.hostname.split(".").length - 2, 0);
        const reasons = [];
        const observedTraits = [];
        let severeSignals = 0;
        let reviewSignals = 0;

        if (parsed.protocol === "http:") {
            reasons.push("Uses insecure HTTP instead of HTTPS");
            observedTraits.push("Insecure transport");
            reviewSignals += 1;
        } else {
            observedTraits.push("Encrypted transport");
        }

        for (const word of suspiciousWords) {
            if (normalized.includes(word)) {
                reasons.push(`Contains suspicious term "${word}"`);
                observedTraits.push(`Keyword: ${word}`);
                reviewSignals += 1;
            }
        }

        if (ipAddressPattern.test(parsed.hostname)) {
            reasons.push("Uses an IP address instead of a named domain");
            observedTraits.push("Direct IP destination");
            severeSignals += 1;
        }

        if (parsed.username || parsed.password || url.includes("@")) {
            reasons.push("Contains userinfo or @-style obfuscation");
            observedTraits.push("Obfuscated authority section");
            severeSignals += 1;
        }

        if (parsed.hostname.includes("xn--")) {
            reasons.push("Uses punycode, which can hide lookalike domains");
            observedTraits.push("Punycode hostname");
            reviewSignals += 1;
        }

        if (knownShorteners.has(parsed.hostname.replace(/^www\./, ""))) {
            reasons.push("Uses a known URL shortener");
            observedTraits.push("Shortened redirect");
            reviewSignals += 1;
        }

        if (url.length > 120) {
            reasons.push("URL is unusually long");
            observedTraits.push("Long URL");
            reviewSignals += 1;
        }

        if (queryParamCount >= 5) {
            reasons.push("Contains a heavy query string");
            observedTraits.push("Tracking-style parameters");
            reviewSignals += 1;
        }

        if (subdomainCount >= 3) {
            reasons.push("Uses a deep subdomain chain");
            observedTraits.push("Deep subdomain stack");
            reviewSignals += 1;
        }

        const riskScore = Math.min(100, severeSignals * 35 + reviewSignals * 14);
        const verdict = severeSignals >= 2 || riskScore >= 50
            ? "Risky"
            : reasons.length > 0
                ? "Suspicious"
                : "Clean";

        return {
            type: "url",
            target: url,
            title: parsed.hostname,
            verdict,
            tone: verdict === "Clean" ? "safe" : verdict === "Suspicious" ? "warn" : "danger",
            riskScore,
            scoreLabel: `${Math.max(totalChecks - severeSignals - reviewSignals, 0)}/${totalChecks}`,
            summaryLine: verdict === "Clean"
                ? `Clean profile. ${parsed.hostname} passed the local URL checks.`
                : verdict === "Suspicious"
                    ? `${parsed.hostname} needs manual review before it is trusted.`
                    : `${parsed.hostname} shows strong risk indicators and should be avoided.`,
            facts: [
                { label: "Status", value: verdict },
                { label: "Domain", value: parsed.hostname },
                { label: "Protocol", value: parsed.protocol.replace(":", "").toUpperCase() },
                { label: "Path Depth", value: String(parsed.pathname.split("/").filter(Boolean).length || 0) }
            ],
            metrics: buildMetrics(totalChecks, severeSignals, reviewSignals),
            assessmentTitle: "URL Risk Assessment",
            assessment: buildAssessment(verdict, reasons, parsed),
            detailTitle: "Detection Details",
            detailBullets: [
                `Total local checks: ${totalChecks}`,
                `Detection rate: ${Math.round((severeSignals + reviewSignals) / totalChecks * 100)}% of checks raised a signal`,
                `Confidence level: ${getConfidenceLevel(totalChecks, severeSignals)}`
            ],
            signalTitle: "Observed Indicators",
            signals: observedTraits.length > 0 ? observedTraits : ["No notable structural anomalies"],
            narrativeTitle: "Analyst Notes",
            narrative: buildNarrative(
                parsed,
                reasons,
                parsed.protocol === "https:" ? "HTTPS" : "HTTP",
                subdomainCount,
                queryParamCount
            )
        };
    } catch {
        return {
            type: "url",
            target: url,
            title: "Invalid URL",
            verdict: "Invalid",
            tone: "warn",
            riskScore: 100,
            scoreLabel: "0/9",
            summaryLine: "The value could not be parsed as a valid URL.",
            facts: [
                { label: "Status", value: "Invalid" },
                { label: "Domain", value: "Unavailable" },
                { label: "Protocol", value: "Unavailable" },
                { label: "Path Depth", value: "Unavailable" }
            ],
            metrics: buildMetrics(9, 1, 0),
            assessmentTitle: "URL Risk Assessment",
            assessment: "This value should be verified manually because it failed basic parsing and cannot be analyzed safely.",
            detailTitle: "Detection Details",
            detailBullets: [
                "Total local checks: 9",
                "Detection rate: parsing failed before validation could complete",
                "Confidence level: Low"
            ],
            signalTitle: "Observed Indicators",
            signals: ["Malformed URL structure"],
            narrativeTitle: "Analyst Notes",
            narrative: [
                "The string does not match a valid URL format.",
                "Manual confirmation is required before this link is opened or shared.",
                "Treat malformed links as suspicious until they are normalized."
            ]
        };
    }
}
