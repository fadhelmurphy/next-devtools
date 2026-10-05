import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useMemo, useState } from "react";
import { api } from "../api.js";
import { ApiErrorBox, useAsync, useDevtools } from "../context.js";
import { IconRefresh } from "../icons.js";
const UPDATE_LABEL = { major: "Major update", minor: "Minor update", patch: "Patch" };
export function Packages() {
    const base = useAsync((f) => api.packages(f));
    const latest = useAsync((f) => api.packagesLatest(f));
    const { toast } = useDevtools();
    const [q, setQ] = useState("");
    const [only, setOnly] = useState("all");
    const list = latest.data ?? base.data ?? [];
    const updates = (latest.data ?? []).filter((p) => p.update);
    const shown = useMemo(() => {
        const needle = q.trim().toLowerCase();
        return list.filter((p) => (only === "all" || p.update) && (!needle || p.name.toLowerCase().includes(needle)));
    }, [list, q, only]);
    if (base.error)
        return _jsx(ApiErrorBox, { error: base.error });
    const copy = async (text) => {
        try {
            await navigator.clipboard.writeText(text);
            toast(`Copied: ${text}`);
        }
        catch {
            toast(text);
        }
    };
    return (_jsxs(_Fragment, { children: [_jsxs("div", { className: "nd-toolbar", children: [_jsx("input", { className: "nd-input", placeholder: "Filter packages", value: q, onChange: (e) => setQ(e.target.value), "aria-label": "Filter packages" }), _jsxs("div", { className: "nd-seg", role: "group", "aria-label": "Show", children: [_jsxs("button", { "aria-pressed": only === "all", onClick: () => setOnly("all"), children: ["All ", list.length ? `(${list.length})` : ""] }), _jsxs("button", { "aria-pressed": only === "updates", onClick: () => setOnly("updates"), children: ["Updates ", latest.data ? `(${updates.length})` : ""] })] }), _jsx("button", { className: "nd-icon-btn", onClick: latest.reload, title: "Check again", "aria-label": "Check for updates again", children: _jsx(IconRefresh, {}) }), _jsx("span", { className: "nd-faint", children: latest.loading ? "Checking the npm registry…" : latest.error ? "Couldn't reach the npm registry" : "" })] }), updates.length > 1 && only === "updates" && (_jsx("div", { style: { marginBottom: 12 }, children: _jsx("button", { className: "nd-btn", onClick: () => copy(`npm i ${updates.map((u) => `${u.name}@latest`).join(" ")}`), children: "Copy upgrade command for all" }) })), _jsxs("table", { className: "nd-table", children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { children: "Package" }), _jsx("th", { children: "Installed" }), _jsx("th", { children: "Latest" }), _jsx("th", { children: "Status" }), _jsx("th", {})] }) }), _jsx("tbody", { children: shown.map((p) => (_jsxs("tr", { children: [_jsxs("td", { children: [_jsx("a", { className: "nd-link nd-mono", href: `https://www.npmjs.com/package/${p.name}`, target: "_blank", rel: "noreferrer", children: p.name }), p.kind === "devDependency" && _jsx("span", { className: "nd-badge", style: { marginLeft: 6 }, children: "dev" })] }), _jsx("td", { className: "nd-mono", children: p.installed ?? _jsx("span", { className: "nd-faint", children: "not installed" }) }), _jsx("td", { className: "nd-mono", children: p.source === "external" ? _jsx("span", { className: "nd-faint", children: p.range }) : p.latest ?? _jsx("span", { className: "nd-faint", children: "\u2026" }) }), _jsx("td", { children: p.update ? _jsx("span", { className: `nd-badge nd-upd-${p.update}`, children: UPDATE_LABEL[p.update] }) : p.latest ? _jsx("span", { className: "nd-faint", children: "Up to date" }) : null }), _jsx("td", { style: { textAlign: "right" }, children: p.update && (_jsx("button", { className: "nd-link", onClick: () => copy(`npm i ${p.kind === "devDependency" ? "-D " : ""}${p.name}@latest`), children: "Copy upgrade command" })) })] }, p.kind + p.name))) })] })] }));
}
