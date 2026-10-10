import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useMemo, useState } from "react";
import { api } from "../api.js";
import { ApiErrorBox, FileLink, useAsync, useDevtools } from "../context.js";
import { buildTree, walkTree } from "../fiber.js";
import { IconOpen, IconRefresh } from "../icons.js";
const ROLE_LABEL = {
    page: "Page",
    layout: "Layout",
    template: "Template",
    loading: "Loading",
    error: "Error",
    "global-error": "Global error",
    "not-found": "Not found",
    forbidden: "Forbidden",
    unauthorized: "Unauthorized",
    default: "Default",
    "pages-special": "Pages special",
};
const RUNTIME_LABEL = { client: "Client", server: "Server", shared: "Shared" };
export function ProjectComponents({ mode }) {
    var _a, _b, _c;
    const comps = useAsync((f) => api.components(f));
    const { open } = useDevtools();
    const [q, setQ] = useState("");
    const [runtime, setRuntime] = useState("all");
    const [selected, setSelected] = useState(null);
    // Names rendered right now, to mark "on this page"
    const onPage = useMemo(() => {
        const names = new Set();
        walkTree(buildTree({ hideInternals: true }), (n) => names.add(n.name));
        return names;
    }, [comps.data]);
    const groups = useMemo(() => {
        var _a;
        const needle = q.trim().toLowerCase();
        const map = new Map();
        for (const c of (_a = comps.data) !== null && _a !== void 0 ? _a : []) {
            if (runtime !== "all" && c.runtime !== runtime)
                continue;
            if (needle && !c.file.toLowerCase().includes(needle) && !c.names.some((n) => n.toLowerCase().includes(needle)))
                continue;
            const dir = c.file.includes("/") ? c.file.slice(0, c.file.lastIndexOf("/")) : ".";
            if (!map.has(dir))
                map.set(dir, []);
            map.get(dir).push(c);
        }
        return [...map.entries()];
    }, [comps.data, q, runtime]);
    const counts = useMemo(() => {
        var _a;
        const c = { client: 0, server: 0, shared: 0 };
        for (const x of (_a = comps.data) !== null && _a !== void 0 ? _a : [])
            c[x.runtime]++;
        return c;
    }, [comps.data]);
    const sel = (_a = comps.data) === null || _a === void 0 ? void 0 : _a.find((c) => c.file === selected);
    return (_jsxs("div", { className: "nd-split", children: [_jsxs("section", { className: "nd-pane", "aria-label": "Component files", children: [_jsx("div", { className: "nd-pane-bar", children: mode }), _jsxs("div", { className: "nd-pane-bar", children: [_jsx("input", { className: "nd-input", placeholder: "Find component or file", value: q, onChange: (e) => setQ(e.target.value), "aria-label": "Find component" }), _jsxs("select", { className: "nd-select", value: runtime, onChange: (e) => setRuntime(e.target.value), "aria-label": "Runtime", children: [_jsxs("option", { value: "all", children: ["All (", (_c = (_b = comps.data) === null || _b === void 0 ? void 0 : _b.length) !== null && _c !== void 0 ? _c : 0, ")"] }), _jsxs("option", { value: "server", children: ["Server (", counts.server, ")"] }), _jsxs("option", { value: "client", children: ["Client (", counts.client, ")"] }), _jsxs("option", { value: "shared", children: ["Shared (", counts.shared, ")"] })] }), _jsx("button", { className: "nd-icon-btn", onClick: comps.reload, title: "Rescan", "aria-label": "Rescan project", children: _jsx(IconRefresh, {}) })] }), _jsxs("div", { className: "nd-pane-body", children: [comps.error && (_jsx("div", { style: { padding: 12 }, children: _jsx(ApiErrorBox, { error: comps.error }) })), comps.loading && !comps.data && _jsx("p", { className: "nd-faint", style: { padding: "8px 14px" }, children: "Scanning project files\u2026" }), groups.map(([dir, files]) => (_jsxs("div", { children: [_jsxs("div", { className: "nd-group-head", children: [dir, "/"] }), files.map((c) => (_jsxs("div", { className: "nd-tree-row", role: "option", "aria-selected": c.file === selected, style: { paddingLeft: 14 }, onClick: () => setSelected(c.file), onDoubleClick: () => open({ file: c.file, line: 1, column: 1 }), title: "Double-click to open in editor", children: [_jsx("span", { className: "nd-tree-name", "data-plain": true, children: c.names.join(", ") }), _jsx("span", { className: `nd-badge nd-rt-${c.runtime}`, children: RUNTIME_LABEL[c.runtime] }), ROLE_LABEL[c.role] && _jsx("span", { className: "nd-badge", children: ROLE_LABEL[c.role] }), c.names.some((n) => onPage.has(n)) && _jsx("span", { className: "nd-dot", title: "Rendered on this page" }), _jsx("button", { className: "nd-row-action", "aria-label": `Open ${c.file} in editor`, title: "Open in editor", onClick: (e) => {
                                                    e.stopPropagation();
                                                    open({ file: c.file, line: 1, column: 1 });
                                                }, children: _jsx(IconOpen, {}) })] }, c.file)))] }, dir)))] })] }), _jsx("section", { className: "nd-pane", "aria-label": "Component file details", children: _jsx("div", { className: "nd-pane-body", children: sel ? (_jsxs("div", { className: "nd-detail", children: [_jsx("h3", { children: sel.names.join(", ") }), _jsxs("div", { style: { marginTop: 8, display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }, children: [_jsxs("button", { className: "nd-btn nd-btn-primary", onClick: () => open({ file: sel.file, line: 1, column: 1 }), children: [_jsx(IconOpen, {}), " Open in editor"] }), _jsx(FileLink, { loc: { file: sel.file, line: 1, column: 1 } })] }), _jsx("table", { className: "nd-kv", style: { marginTop: 14 }, children: _jsxs("tbody", { children: [_jsxs("tr", { children: [_jsx("td", { children: "Renders on" }), _jsx("td", { children: sel.runtime === "client"
                                                        ? sel.directive === "client"
                                                            ? 'Client ("use client")'
                                                            : "Client (Pages Router)"
                                                        : sel.runtime === "server"
                                                            ? "Server (App Router default)"
                                                            : "Shared — server or client, depending on who imports it" })] }), ROLE_LABEL[sel.role] && (_jsxs("tr", { children: [_jsx("td", { children: "Role" }), _jsxs("td", { children: [ROLE_LABEL[sel.role], " file"] })] })), _jsxs("tr", { children: [_jsx("td", { children: "On this page" }), _jsx("td", { children: sel.names.some((n) => onPage.has(n)) ? "Yes" : "No" })] }), _jsxs("tr", { children: [_jsx("td", { children: "Lines" }), _jsx("td", { children: sel.lines })] })] }) }), _jsxs("div", { className: "nd-section", children: [_jsxs("h3", { style: { fontFamily: "var(--sans)", fontSize: 12.5, color: "var(--muted)" }, children: ["Imported by ", sel.usedBy.length, " ", sel.usedBy.length === 1 ? "file" : "files"] }), sel.usedBy.length ? (_jsx("div", { style: { display: "flex", flexDirection: "column", gap: 4 }, children: sel.usedBy.map((f) => (_jsx(FileLink, { loc: { file: f, line: 1, column: 1 } }, f))) })) : (_jsx("span", { className: "nd-faint", children: ROLE_LABEL[sel.role] ? "Loaded by Next.js from the file system" : "Not imported anywhere — possibly unused" }))] })] })) : (_jsxs("div", { className: "nd-empty", style: { padding: "20px 16px" }, children: [_jsx("strong", { children: comps.data ? `${comps.data.length} component files` : "Component files" }), "Every file in the project that exports a React component, with where it renders and who imports it. A dot marks components rendered on this page."] })) }) })] }));
}
