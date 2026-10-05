import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from "react";
import { IconChevron } from "./icons.js";
/** Collapsible JSON viewer for config, payloads and response bodies. */
export function JsonTree({ value, name, depth = 0, open = 1 }) {
    const isObj = value !== null && typeof value === "object";
    const [expanded, setExpanded] = useState(depth < open);
    const label = name !== undefined ? _jsx("span", { className: "nd-json-key", children: name }) : null;
    if (!isObj) {
        return (_jsxs("div", { className: "nd-json-row", style: { paddingLeft: depth * 14 + 16 }, children: [label, label && _jsx("span", { className: "nd-faint", children: ": " }), _jsx(JsonValue, { value: value })] }));
    }
    const entries = Array.isArray(value) ? value.map((v, i) => [String(i), v]) : Object.entries(value);
    const summary = Array.isArray(value) ? `Array(${entries.length})` : entries.length ? `{${entries.length}}` : "{}";
    return (_jsxs(_Fragment, { children: [_jsxs("div", { className: "nd-json-row", style: { paddingLeft: depth * 14 }, children: [_jsx("button", { className: "nd-tree-toggle", "aria-expanded": expanded, onClick: () => setExpanded(!expanded), disabled: !entries.length, children: entries.length ? _jsx(IconChevron, {}) : null }), label, label && _jsx("span", { className: "nd-faint", children: ": " }), _jsx("span", { className: "nd-faint", children: summary })] }), expanded && entries.slice(0, 500).map(([k, v]) => _jsx(JsonTree, { name: k, value: v, depth: depth + 1, open: open }, k)), expanded && entries.length > 500 && (_jsxs("div", { className: "nd-json-row nd-faint", style: { paddingLeft: (depth + 1) * 14 + 16 }, children: ["\u2026", entries.length - 500, " more"] }))] }));
}
function JsonValue({ value }) {
    if (typeof value === "string") {
        const fn = value.startsWith("ƒ ");
        const shown = value.length > 300 ? value.slice(0, 300) + "…" : value;
        return _jsx("span", { className: fn ? "nd-json-fn" : "nd-json-str", children: fn ? shown : JSON.stringify(shown) });
    }
    if (typeof value === "number" || typeof value === "bigint")
        return _jsx("span", { className: "nd-json-num", children: String(value) });
    if (typeof value === "boolean")
        return _jsx("span", { className: "nd-json-bool", children: String(value) });
    return _jsx("span", { className: "nd-faint", children: String(value) });
}
