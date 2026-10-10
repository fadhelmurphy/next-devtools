import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import { getVitals, measuredPath, rate, subscribeVitals, THRESHOLDS } from "../vitals.js";
import { formatBytes } from "./Assets.js";
const META = [
    { key: "lcp", name: "LCP", title: "Largest Contentful Paint", unit: "ms" },
    { key: "inp", name: "INP", title: "Interaction to Next Paint", unit: "ms" },
    { key: "cls", name: "CLS", title: "Cumulative Layout Shift", unit: "" },
    { key: "fcp", name: "FCP", title: "First Contentful Paint", unit: "ms" },
    { key: "ttfb", name: "TTFB", title: "Time to First Byte", unit: "ms" },
];
function useVitals() {
    const [v, set] = useState(getVitals);
    useEffect(() => subscribeVitals(() => set(getVitals())), []);
    return v;
}
function Phases() {
    const nav = performance.getEntriesByType("navigation")[0];
    if (!nav)
        return _jsx("span", { className: "nd-faint", children: "Navigation timing isn't available." });
    const phases = [
        { name: "Redirect", start: nav.redirectStart, end: nav.redirectEnd },
        { name: "DNS", start: nav.domainLookupStart, end: nav.domainLookupEnd },
        { name: "Connect", start: nav.connectStart, end: nav.connectEnd },
        { name: "Server response", start: nav.requestStart, end: nav.responseStart },
        { name: "Download", start: nav.responseStart, end: nav.responseEnd },
        { name: "DOM parsing", start: nav.responseEnd, end: nav.domInteractive },
        { name: "Hydration window", start: nav.domInteractive, end: nav.domContentLoadedEventEnd },
        { name: "Load event", start: nav.loadEventStart, end: nav.loadEventEnd },
    ].filter((p) => p.end > 0 && p.end >= p.start);
    const total = Math.max(nav.loadEventEnd || 0, nav.domContentLoadedEventEnd, 1);
    return (_jsx("div", { className: "nd-waterfall", children: phases.map((p) => (_jsxs("div", { className: "nd-wf-row", children: [_jsx("span", { className: "nd-muted", children: p.name }), _jsx("div", { className: "nd-wf-track", children: _jsx("div", { className: "nd-wf-bar", style: { left: `${(p.start / total) * 100}%`, width: `${((p.end - p.start) / total) * 100}%` } }) }), _jsxs("span", { children: [Math.round(p.end - p.start), " ms"] })] }, p.name))) }));
}
function Resources() {
    var _a;
    const entries = performance.getEntriesByType("resource");
    const groups = new Map();
    for (const e of entries) {
        const type = e.initiatorType === "link" && /\.css(\?|$)/.test(e.name) ? "css" : e.initiatorType || "other";
        const g = (_a = groups.get(type)) !== null && _a !== void 0 ? _a : { count: 0, bytes: 0, slowest: 0 };
        g.count++;
        g.bytes += e.transferSize || e.encodedBodySize || 0;
        g.slowest = Math.max(g.slowest, e.duration);
        groups.set(type, g);
    }
    if (!groups.size)
        return _jsx("span", { className: "nd-faint", children: "No resources recorded yet." });
    return (_jsxs("table", { className: "nd-table", style: { maxWidth: 620 }, children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { children: "Type" }), _jsx("th", { children: "Requests" }), _jsx("th", { children: "Transferred" }), _jsx("th", { children: "Slowest" })] }) }), _jsx("tbody", { children: [...groups.entries()]
                    .sort((a, b) => b[1].bytes - a[1].bytes)
                    .map(([type, g]) => (_jsxs("tr", { children: [_jsx("td", { className: "nd-mono", children: type }), _jsx("td", { children: g.count }), _jsx("td", { children: formatBytes(g.bytes) }), _jsxs("td", { children: [Math.round(g.slowest), " ms"] })] }, type))) })] }));
}
export function Performance() {
    const v = useVitals();
    const [, tick] = useState(0);
    return (_jsxs(_Fragment, { children: [_jsxs("div", { className: "nd-section", children: [_jsxs("h3", { children: ["Web Vitals for the page load of ", _jsx("code", { children: measuredPath })] }), _jsx("div", { className: "nd-vitals", children: META.map((m) => {
                            const value = v[m.key];
                            const rating = value == null ? undefined : rate(m.key, value);
                            const [good, poor] = THRESHOLDS[m.key];
                            const pct = value == null ? 0 : Math.min(100, (value / (poor * 1.25)) * 100);
                            return (_jsxs("div", { className: "nd-vital", "data-rating": rating, title: `Good ≤ ${good}${m.unit}, poor > ${poor}${m.unit}`, children: [_jsxs("div", { className: "nd-vital-name", children: [_jsx("span", { children: m.title }), _jsx("span", { className: "nd-mono", children: m.name })] }), _jsx("div", { className: "nd-vital-value", children: value == null ? _jsx("span", { className: "nd-faint", children: "\u2014" }) : m.unit ? _jsxs(_Fragment, { children: [Math.round(value), _jsx("small", { children: "ms" })] }) : value.toFixed(3) }), _jsx("div", { className: "nd-meter", children: _jsx("span", { style: { width: `${pct}%` } }) })] }, m.key));
                        }) }), _jsxs("p", { className: "nd-faint", style: { margin: "10px 0 0", maxWidth: "70ch" }, children: ["Measured from the last full page load; client-side navigations don't reset them. Dev mode is slower than production, so compare against ", _jsx("code", { children: "next build && next start" }), " before optimizing. INP updates as you interact."] })] }), _jsxs("div", { className: "nd-section", children: [_jsxs("h3", { style: { display: "flex", alignItems: "center", gap: 8 }, children: ["Initial document load", _jsx("button", { className: "nd-link", style: { fontWeight: 500 }, onClick: () => tick((n) => n + 1), children: "Update" })] }), _jsx(Phases, {})] }), _jsxs("div", { className: "nd-section", children: [_jsx("h3", { children: "Resources" }), _jsx(Resources, {})] })] }));
}
