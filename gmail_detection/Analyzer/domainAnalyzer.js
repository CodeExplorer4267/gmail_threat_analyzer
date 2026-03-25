const riskyDomains = new Set([
    "bit.ly",
    "tinyurl.com",
    "goo.gl",
    "t.co"
]);

const suspiciousTlds = [".zip", ".mov", ".country", ".gq", ".tk"];
const sharedHostingHints = ["github.io", "pages.dev", "web.app", "vercel.app", "netlify.app"];

function normalizeDomain(domain) {
    return domain.toLowerCase().replace(/^www\./, "");
}

function buildMetrics(totalChecks, severeSignals, reviewSignals) {
    const passedChecks = Math.max(totalChecks - severeSignals - reviewSignals, 0);

    return [
        { label: "Passed checks", value: passedChecks, tone: "safe" },
        { label: "High-risk signals", value: severeSignals, tone: "danger" },
        { label: "Review signals", value: reviewSignals, tone: "warn" },
        { label: "Context notes", value: Math.max(totalChecks - passedChecks - severeSignals - reviewSignals, 0), tone: "neutral" }
    ];
}

function buildAssessment(verdict, domain) {
    if (verdict === "Risky") {
        return `${domain} triggered multiple domain-level warning signs. It should not be trusted without confirming ownership and intent.`;
    }

    if (verdict === "Suspicious") {
        return `${domain} is not clearly malicious, but its registration or naming pattern is unusual enough to justify a manual check.`;
    }

    return `${domain} appears stable under the current local domain checks. No obvious shortener, deceptive TLD, or lookalike pattern was detected.`;
}

function inferCategory(domain) {
    const labels = [];

    if (domain.includes("jobs") || domain.includes("career")) {
        labels.push("recruitment");
    }

    if (domain.includes("pay") || domain.includes("bank") || domain.includes("wallet")) {
        labels.push("financial");
    }

    if (domain.includes("mail") || domain.includes("auth") || domain.includes("login")) {
        labels.push("identity");
    }

    return labels.length > 0 ? labels : ["general web"];
}

export function analyzeDomain(domain) {
    const normalized = normalizeDomain(domain);
    const parts = normalized.split(".");
    const totalChecks = 8;
    const reasons = [];
    const traits = [];
    let severeSignals = 0;
    let reviewSignals = 0;

    if (riskyDomains.has(normalized)) {
        reasons.push("Known URL shortener");
        traits.push("Shortener service");
        reviewSignals += 1;
    }

    if (suspiciousTlds.some((tld) => normalized.endsWith(tld))) {
        reasons.push("Uses a high-risk top-level domain");
        traits.push("High-risk TLD");
        severeSignals += 1;
    }

    if (normalized.includes("xn--")) {
        reasons.push("Uses punycode and may visually mimic another domain");
        traits.push("Punycode hostname");
        reviewSignals += 1;
    }

    if ((normalized.match(/-/g) || []).length >= 2) {
        reasons.push("Contains multiple hyphens");
        traits.push("Hyphen-heavy naming");
        reviewSignals += 1;
    }

    if ((normalized.match(/\d/g) || []).length >= 3) {
        reasons.push("Contains an unusual amount of numeric characters");
        traits.push("Numeric naming pattern");
        reviewSignals += 1;
    }

    if (parts.length > 3) {
        reasons.push("Uses a deep subdomain chain");
        traits.push("Deep subdomain stack");
        reviewSignals += 1;
    }

    if (sharedHostingHints.some((suffix) => normalized.endsWith(suffix))) {
        reasons.push("Hosted on a shared deployment platform");
        traits.push("Shared hosting platform");
        reviewSignals += 1;
    }

    const riskScore = Math.min(100, severeSignals * 40 + reviewSignals * 12);
    const verdict = severeSignals >= 2 || riskScore >= 50
        ? "Risky"
        : reasons.length > 0
            ? "Suspicious"
            : "Clean";

    return {
        type: "domain",
        target: domain,
        title: normalized,
        verdict,
        tone: verdict === "Clean" ? "safe" : verdict === "Suspicious" ? "warn" : "danger",
        riskScore,
        scoreLabel: `${Math.max(totalChecks - severeSignals - reviewSignals, 0)}/${totalChecks}`,
        summaryLine: verdict === "Clean"
            ? `Clean profile. ${normalized} passed the local domain reputation checks.`
            : verdict === "Suspicious"
                ? `${normalized} includes indicators that deserve manual verification.`
                : `${normalized} presents multiple domain-level warning signs.`,
        facts: [
            { label: "Status", value: verdict },
            { label: "Domain", value: normalized },
            { label: "TLD", value: (parts[parts.length - 1] || "N/A").toUpperCase() },
            { label: "Subdomains", value: String(Math.max(parts.length - 2, 0)) }
        ],
        metrics: buildMetrics(totalChecks, severeSignals, reviewSignals),
        assessmentTitle: "Domain Risk Assessment",
        assessment: buildAssessment(verdict, normalized),
        detailTitle: "Reputation Details",
        detailBullets: [
            `Total local checks: ${totalChecks}`,
            `Signal rate: ${Math.round((severeSignals + reviewSignals) / totalChecks * 100)}% of checks raised a review condition`,
            `Confidence level: ${verdict === "Clean" ? "High" : "Medium"}`
        ],
        signalTitle: "Content Categories",
        signals: inferCategory(normalized).concat(traits.length > 0 ? traits : ["Normal registration pattern"]),
        narrativeTitle: "Analyst Notes",
        narrative: [
            `Domain reviewed: ${normalized}`,
            `Primary namespace depth: ${Math.max(parts.length - 2, 0)} subdomain level(s) detected.`,
            reasons.length > 0
                ? `Most relevant concern: ${reasons[0]}.`
                : "The naming pattern is short, readable, and does not resemble common disposable or disguised infrastructure."
        ]
    };
}
