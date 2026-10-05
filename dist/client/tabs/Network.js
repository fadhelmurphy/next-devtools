import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useMemo, useState } from "react";
import { JsonTree } from "../JsonTree.js";
import { clearEntries, getEntries, subscribeNetwork } from "../network.js";
import { formatBytes } from "./Assets.js";
const KIND_LABEL = {
    rsc: "RSC",
    action: "Server Action",
    api: "API",
    fetch: "Fetch",
    external: "External",
    next: "Next.js",
    navigation: "Navigation",
};
const FILTERS = [
    { id: "all", label: "All" },
    { id: "rsc", label: "RSC" },
    { id: "action", label: "Actions" },
    { id: "api", label: "API" },
    { id: "fetch", label: "Fetch" },
    { id: "external", label: "External" },
    { id: "navigation", label: "Navigations" },
];
function useEntries() {
    const [list, set] = useState(getEntries);
    useEffect(() => subscribeNetwork(() => set(getEntries())), []);
    return list;
}
function tryJson(text) {
    if (!text)
        return undefined;
    try {
        return JSON.parse(text);
    }
    catch {
        return undefined;
    }
}
const shortUrl = (url) => {
    try {
        const u = new URL(url, location.href);
        return u.origin === location.origin ? u.pathname + u.search : u.host + u.pathname;
    }
    catch {
        return url;
    }
};
export function Network() {
    const entries = useEntries();
    const [filter, setFilter] = useState("all");
    const [showNext, setShowNext] = useState(false);
    const [q, setQ] = useState("");
    const [selected, setSelected] = useState(null);
    const list = useMemo(() => {
        const needle = q.trim().toLowerCase();
        return entries
            .filter((e) => (filter === "all" ? showNext || e.kind !== "next" : e.kind === filter))
            .filter((e) => !needle || e.url.toLowerCase().includes(needle))
            .slice()
            .reverse();
    }, [entries, filter, showNext, q]);
    const sel = entries.find((e) => e.id === selected);
    return (_jsxs("div", { className: "nd-split", children: [_jsxs("section", { className: "nd-pane", "aria-label": "Requests", children: [_jsxs("div", { className: "nd-pane-bar", children: [_jsx("input", { className: "nd-input", placeholder: "Filter by URL", value: q, onChange: (e) => setQ(e.target.value), "aria-label": "Filter requests" }), _jsx("button", { className: "nd-btn", onClick: () => (clearEntries(), setSelected(null)), children: "Clear" })] }), _jsxs("div", { className: "nd-pane-bar", style: { paddingTop: 6, paddingBottom: 6 }, children: [_jsx("div", { className: "nd-seg", role: "group", "aria-label": "Request type", children: FILTERS.map((f) => (_jsx("button", { "aria-pressed": filter === f.id, onClick: () => setFilter(f.id), children: f.label }, f.id))) }), _jsxs("label", { className: "nd-check", children: [_jsx("input", { type: "checkbox", checked: showNext, onChange: (e) => setShowNext(e.target.checked) }), "Next.js internals"] })] }), _jsx("div", { className: "nd-pane-body", style: { paddingTop: 0 }, children: !list.length ? (_jsxs("div", { className: "nd-empty", style: { padding: "20px 14px" }, children: [_jsx("strong", { children: "No requests yet" }), "Client navigations, Server Actions, route handlers and fetch() calls from the browser show up here as they happen."] })) : (_jsx("table", { className: "nd-table nd-net", children: _jsx("tbody", { children: list.map((e) => (_jsxs("tr", { "aria-selected": e.id === selected, onClick: () => setSelected(e.id), "data-kind": e.kind, children: [_jsx("td", { style: { width: 1 }, children: _jsx("span", { className: `nd-badge nd-kind-${e.kind}`, children: KIND_LABEL[e.kind] }) }), _jsx("td", { className: "nd-mono nd-net-url", title: e.url, children: e.kind === "navigation" ? _jsxs(_Fragment, { children: [e.requestHeaders?.from, " \u2192 ", e.url] }) : _jsxs(_Fragment, { children: [e.method !== "GET" && _jsxs("b", { children: [e.method, " "] }), shortUrl(e.url)] }) }), _jsx("td", { className: "nd-mono", style: { width: 1, textAlign: "right" }, children: e.kind === "navigation" ? "" : e.error ? _jsx("span", { style: { color: "var(--bad)" }, children: "failed" }) : e.status ?? _jsx("span", { className: "nd-faint", children: "\u2026" }) }), _jsx("td", { className: "nd-mono nd-faint", style: { width: 1, textAlign: "right", whiteSpace: "nowrap" }, children: e.duration != null ? `${Math.round(e.duration)} ms` : "" })] }, e.id))) }) })) })] }), _jsx("section", { className: "nd-pane", "aria-label": "Request details", children: _jsx("div", { className: "nd-pane-body", children: sel ? _jsx(Details, { e: sel }) : _jsxs("div", { className: "nd-empty", style: { padding: "20px 16px" }, children: [_jsx("strong", { children: "Select a request" }), "See headers, payload and the response."] }) }) })] }));
}
function Details({ e }) {
    const reqJson = tryJson(e.requestBody);
    const resJson = tryJson(e.responseBody);
    return (_jsxs("div", { className: "nd-detail", children: [_jsxs("h3", { style: { fontFamily: "var(--mono)", wordBreak: "break-all" }, children: [_jsx("span", { className: `nd-badge nd-kind-${e.kind}`, children: KIND_LABEL[e.kind] }), " ", e.method, " ", e.kind === "navigation" ? e.url : shortUrl(e.url)] }), _jsx("table", { className: "nd-kv", style: { marginTop: 10 }, children: _jsxs("tbody", { children: [e.status != null && _jsxs("tr", { children: [_jsx("td", { children: "Status" }), _jsx("td", { children: e.status })] }), e.error && _jsxs("tr", { children: [_jsx("td", { children: "Error" }), _jsx("td", { style: { color: "var(--bad)" }, children: e.error })] }), e.duration != null && _jsxs("tr", { children: [_jsx("td", { children: "Time" }), _jsxs("td", { children: [Math.round(e.duration), " ms"] })] }), e.size != null && _jsxs("tr", { children: [_jsx("td", { children: "Size" }), _jsx("td", { children: formatBytes(e.size) })] }), e.contentType && _jsxs("tr", { children: [_jsx("td", { children: "Type" }), _jsx("td", { children: e.contentType })] }), e.action && _jsxs("tr", { children: [_jsx("td", { children: "Action ID" }), _jsx("td", { children: e.action })] })] }) }), e.requestBody && (_jsxs("div", { className: "nd-section", children: [_jsx("h3", { children: "Request body" }), reqJson !== undefined ? _jsx("div", { className: "nd-json", children: _jsx(JsonTree, { value: reqJson, open: 2 }) }) : _jsx("pre", { className: "nd-pre", children: e.requestBody })] })), e.responseBody && (_jsxs("div", { className: "nd-section", children: [_jsx("h3", { children: "Response" }), resJson !== undefined ? _jsx("div", { className: "nd-json", children: _jsx(JsonTree, { value: resJson, open: 2 }) }) : _jsx("pre", { className: "nd-pre", children: e.responseBody })] })), e.kind === "rsc" && !e.responseBody && (_jsx("p", { className: "nd-faint", children: "RSC responses stream React Flight data; the body isn't captured." })), e.responseHeaders && Object.keys(e.responseHeaders).length > 0 && (_jsxs("div", { className: "nd-section", children: [_jsx("h3", { children: "Response headers" }), _jsx("table", { className: "nd-kv", children: _jsx("tbody", { children: Object.entries(e.responseHeaders).map(([k, v]) => _jsxs("tr", { children: [_jsx("td", { children: k }), _jsx("td", { children: v })] }, k)) }) })] })), e.kind !== "navigation" && e.requestHeaders && Object.keys(e.requestHeaders).length > 0 && (_jsxs("div", { className: "nd-section", children: [_jsx("h3", { children: "Request headers" }), _jsx("table", { className: "nd-kv", children: _jsx("tbody", { children: Object.entries(e.requestHeaders).map(([k, v]) => _jsxs("tr", { children: [_jsx("td", { children: k }), _jsx("td", { children: v })] }, k)) }) })] }))] }));
}
