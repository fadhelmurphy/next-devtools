import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useMemo, useState } from "react";
import { api } from "../api.js";
import { ApiErrorBox, useAsync, useDevtools } from "../context.js";
import { IconRefresh } from "../icons.js";
export const formatBytes = (n) => n < 1024 ? `${n} B` : n < 1024 ** 2 ? `${(n / 1024).toFixed(1)} KB` : `${(n / 1024 ** 2).toFixed(2)} MB`;
const TYPES = [
    { value: "all", label: "All files" },
    { value: "image", label: "Images" },
    { value: "video", label: "Video" },
    { value: "audio", label: "Audio" },
    { value: "font", label: "Fonts" },
    { value: "text", label: "Text" },
    { value: "other", label: "Other" },
];
export function Assets() {
    const assets = useAsync((f) => api.assets(f));
    const { toast, open } = useDevtools();
    const [q, setQ] = useState("");
    const [type, setType] = useState("all");
    const list = useMemo(() => {
        const needle = q.trim().toLowerCase();
        return (assets.data ?? []).filter((a) => (type === "all" || a.type === type) && (!needle || a.path.toLowerCase().includes(needle)));
    }, [assets.data, q, type]);
    const total = useMemo(() => (assets.data ?? []).reduce((s, a) => s + a.size, 0), [assets.data]);
    if (assets.error)
        return _jsx(ApiErrorBox, { error: assets.error });
    const copy = async (a) => {
        try {
            await navigator.clipboard.writeText(a.path);
            toast(`Copied ${a.path}`);
        }
        catch {
            toast(a.path);
        }
    };
    return (_jsxs(_Fragment, { children: [_jsxs("div", { className: "nd-toolbar", children: [_jsx("input", { className: "nd-input", placeholder: "Filter files in public/", value: q, onChange: (e) => setQ(e.target.value), "aria-label": "Filter assets" }), _jsx("select", { className: "nd-select", value: type, onChange: (e) => setType(e.target.value), "aria-label": "File type", children: TYPES.map((t) => (_jsx("option", { value: t.value, children: t.label }, t.value))) }), _jsx("button", { className: "nd-icon-btn", onClick: assets.reload, title: "Rescan", "aria-label": "Rescan public folder", children: _jsx(IconRefresh, {}) }), assets.data && (_jsxs("span", { className: "nd-faint", children: [list.length, " files, ", formatBytes(total), " total"] }))] }), assets.data && !assets.data.length ? (_jsxs("div", { className: "nd-empty", children: [_jsx("strong", { children: "public/ is empty" }), "Files you put in ", _jsx("code", { children: "public/" }), " are served from the site root and show up here."] })) : (_jsx("div", { className: "nd-assets", children: list.map((a) => (_jsxs("div", { className: "nd-asset", children: [_jsx("button", { className: "nd-asset-preview", style: { border: 0, cursor: "pointer", width: "100%" }, onClick: () => copy(a), title: "Copy URL", children: a.type === "image" ? _jsx("img", { src: a.path, alt: "", loading: "lazy" }) : _jsx("span", { children: a.path.split(".").pop() }) }), _jsxs("div", { className: "nd-asset-meta", children: [_jsx("div", { className: "nd-asset-name", children: a.path }), _jsxs("div", { className: "nd-asset-size", style: { display: "flex", justifyContent: "space-between", gap: 8 }, children: [_jsx("span", { children: formatBytes(a.size) }), _jsxs("span", { style: { display: "flex", gap: 8 }, children: [_jsx("a", { className: "nd-link", href: a.path, target: "_blank", rel: "noreferrer", children: "View" }), a.type === "text" && (_jsx("button", { className: "nd-link", onClick: () => open({ file: a.file, line: 1, column: 1 }), children: "Edit" }))] })] })] })] }, a.path))) }))] }));
}
