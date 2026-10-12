import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import { describeReason, formatMs, profilerAvailable, severity, statFor, subscribeProfile } from "./profiler.js";
/** Re-render when new render data arrives (throttled in the profiler). */
export function useProfileVersion() {
    const [v, set] = useState(0);
    useEffect(() => subscribeProfile(() => set((n) => n + 1)), []);
    return v;
}
function ago(at) {
    const s = Math.max(0, (performance.now() - at) / 1000);
    if (s < 1)
        return "just now";
    if (s < 60)
        return `${Math.round(s)}s ago`;
    if (s < 3600)
        return `${Math.round(s / 60)}m ago`;
    return `${Math.round(s / 3600)}h ago`;
}
export function Sparkline({ values }) {
    const max = Math.max(...values, 0.01);
    return (_jsx("div", { className: "nd-spark", "aria-label": `Last ${values.length} render times`, children: values.map((v, i) => (_jsx("span", { "data-sev": severity(v), style: { height: `${Math.max(2, (v / max) * 28)}px` }, title: formatMs(v) }, i))) }));
}
/** The latest stat for any fiber of a client tree node. */
export function statForNode(node) {
    if (node.kind !== "client")
        return undefined;
    return statFor(node.fibers[0]);
}
export function RenderInfo({ node }) {
    useProfileVersion();
    const [, tick] = useState(0);
    useEffect(() => {
        const id = setInterval(() => tick((n) => n + 1), 5000); // keep "x ago" fresh
        return () => clearInterval(id);
    }, []);
    if (node.kind === "server") {
        return _jsx("span", { className: "nd-faint", children: "Server Component: rendered on the server, so there's no browser render time." });
    }
    if (!profilerAvailable()) {
        return _jsx("span", { className: "nd-faint", children: "Render timing needs React's DevTools hook, which wasn't found on this page." });
    }
    const s = statForNode(node);
    if (!s)
        return _jsx("span", { className: "nd-faint", children: "No renders recorded yet. Interact with the page to see timings." });
    const avg = s.totalSelf / s.renders;
    return (_jsxs("div", { children: [_jsx("table", { className: "nd-kv", children: _jsxs("tbody", { children: [_jsxs("tr", { children: [_jsx("td", { children: "Last render" }), _jsxs("td", { children: [_jsx("span", { className: `nd-sev-${severity(s.lastSelf)}`, children: formatMs(s.lastSelf) }), " self, ", formatMs(s.lastTotal), " with children, ", ago(s.lastAt)] })] }), _jsxs("tr", { children: [_jsx("td", { children: "Renders" }), _jsxs("td", { children: [s.renders, " recorded, average ", formatMs(avg), ", slowest ", formatMs(s.maxSelf)] })] }), _jsxs("tr", { children: [_jsx("td", { children: "Why" }), _jsx("td", { children: describeReason(s.lastReason) })] })] }) }), s.history.length > 1 && _jsx(Sparkline, { values: s.history })] }));
}
/** Compact "0.42 ms" for tree rows. */
export function RenderBadge({ node }) {
    const s = statForNode(node);
    if (!s)
        return null;
    return (_jsx("span", { className: "nd-ms", "data-sev": severity(s.lastSelf), title: `${s.renders} renders, last ${formatMs(s.lastSelf)} self (${formatMs(s.lastTotal)} with children)`, children: formatMs(s.lastSelf).replace(" ", "") }));
}
