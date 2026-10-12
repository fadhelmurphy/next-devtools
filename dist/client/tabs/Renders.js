import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from "react";
import { useDevtools, useSettings } from "../context.js";
import { idOf, isInternalName } from "../fiber.js";
import { clearProfile, describeReason, formatMs, getCommits, getStats, isHighlighting, isRecording, profilerAvailable, setHighlight, setRecording, severity, } from "../profiler.js";
import { useProfileVersion } from "../RenderInfo.js";
const COLUMNS = [
    { key: "totalSelf", label: "Total" },
    { key: "renders", label: "Renders" },
    { key: "avg", label: "Average" },
    { key: "maxSelf", label: "Slowest" },
    { key: "lastSelf", label: "Last" },
];
const value = (s, k) => (k === "avg" ? s.totalSelf / s.renders : s[k]);
export function Renders() {
    useProfileVersion();
    const { selectComponent } = useDevtools();
    const { hideInternals } = useSettings();
    const [q, setQ] = useState("");
    const [sort, setSort] = useState("totalSelf");
    const commits = getCommits();
    const needle = q.trim().toLowerCase();
    const rows = [...getStats().values()]
        .filter((s) => !(hideInternals && isInternalName(s.name)))
        .filter((s) => !needle || s.name.toLowerCase().includes(needle))
        .sort((a, b) => value(b, sort) - value(a, sort))
        .slice(0, 300);
    if (!profilerAvailable()) {
        return (_jsxs("div", { className: "nd-empty", children: [_jsx("strong", { children: "Render timing isn't available" }), "React's DevTools hook wasn't found on this page. It's normally installed by React Refresh during ", _jsx("code", { children: "next dev" }), "."] }));
    }
    const recent = commits.slice(-60);
    const lastCommit = commits[commits.length - 1];
    const maxCommit = Math.max(...recent.map((c) => c.duration), 1);
    return (_jsxs(_Fragment, { children: [_jsxs("div", { className: "nd-toolbar", children: [_jsx("input", { className: "nd-input", placeholder: "Filter components", value: q, onChange: (e) => setQ(e.target.value), "aria-label": "Filter components" }), _jsx("button", { className: "nd-btn", "aria-pressed": isRecording(), onClick: () => setRecording(!isRecording()), children: isRecording() ? "Recording" : "Paused" }), _jsx("button", { className: "nd-btn", onClick: clearProfile, children: "Clear" }), _jsxs("label", { className: "nd-check", children: [_jsx("input", { type: "checkbox", checked: isHighlighting(), onChange: (e) => setHighlight(e.target.checked) }), "Highlight renders on the page"] })] }), _jsxs("div", { className: "nd-section", style: { marginTop: 0 }, children: [_jsxs("h3", { children: ["Commits", " ", _jsx("span", { className: "nd-faint", style: { fontWeight: 400 }, children: commits.length ? `${commits.length} recorded, last took ${formatMs(lastCommit.duration)} and rendered ${lastCommit.components} ${lastCommit.components === 1 ? "component" : "components"}` : "none since the panel opened" })] }), recent.length > 0 && (_jsx("div", { className: "nd-commits", "aria-label": "Commit durations", children: recent.map((c, i) => (_jsx("span", { "data-sev": severity(c.duration), style: { height: `${Math.max(2, (c.duration / maxCommit) * 44)}px` }, title: `${formatMs(c.duration)}, ${c.components} components` }, i))) }))] }), rows.length === 0 ? (_jsxs("div", { className: "nd-empty", children: [_jsx("strong", { children: "No renders yet" }), "Click around the page; every client component that renders shows up here with its time."] })) : (_jsxs("table", { className: "nd-table nd-renders", children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { children: "Component" }), COLUMNS.map((c) => (_jsx("th", { className: "nd-num", children: _jsx("button", { className: "nd-link", onClick: () => setSort(c.key), "aria-pressed": sort === c.key, style: { fontWeight: sort === c.key ? 700 : 500 }, children: c.label }) }, c.key))), _jsx("th", { children: "Last reason" })] }) }), _jsx("tbody", { children: rows.map((s) => (_jsxs("tr", { onClick: () => selectComponent(idOf(s.fiber)), title: "Show in Components", children: [_jsx("td", { className: "nd-mono", children: s.name }), _jsx("td", { className: "nd-num", children: formatMs(s.totalSelf) }), _jsx("td", { className: "nd-num", children: s.renders }), _jsx("td", { className: "nd-num", children: formatMs(s.totalSelf / s.renders) }), _jsx("td", { className: "nd-num", children: _jsx("span", { className: `nd-sev-${severity(s.maxSelf)}`, children: formatMs(s.maxSelf) }) }), _jsx("td", { className: "nd-num", children: formatMs(s.lastSelf) }), _jsx("td", { className: "nd-muted", children: describeReason(s.lastReason) })] }, s.id))) })] })), _jsx("p", { className: "nd-faint", style: { margin: "12px 0 0", maxWidth: "75ch" }, children: "Times are each component's own render work in the browser, measured by React in development mode \u2014 slower than production, but good for comparing components and spotting needless re-renders. Server Components render on the server and don't appear here." })] }));
}
