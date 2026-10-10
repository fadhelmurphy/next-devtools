import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { api } from "../api.js";
import { ApiErrorBox, FileLink, useAsync } from "../context.js";
import { JsonTree } from "../JsonTree.js";
import { IconRefresh } from "../icons.js";
export function Config() {
    var _a, _b, _c, _d, _e, _f;
    const cfg = useAsync((f) => api.config(f));
    const info = useAsync((f) => api.info(f));
    if (cfg.error)
        return _jsx(ApiErrorBox, { error: cfg.error });
    const root = (_b = (_a = info.data) === null || _a === void 0 ? void 0 : _a.root) === null || _b === void 0 ? void 0 : _b.replace(/\\/g, "/");
    const rel = (f) => (root && f.replace(/\\/g, "/").startsWith(root) ? f.replace(/\\/g, "/").slice(root.length + 1) : f);
    const keys = Object.keys((_d = (_c = cfg.data) === null || _c === void 0 ? void 0 : _c.config) !== null && _d !== void 0 ? _d : {});
    return (_jsxs(_Fragment, { children: [_jsxs("div", { className: "nd-section", children: [_jsxs("h3", { style: { display: "flex", alignItems: "center", gap: 8 }, children: [((_e = info.data) === null || _e === void 0 ? void 0 : _e.configFile) ? _jsx(FileLink, { loc: { file: info.data.configFile, line: 1, column: 1 } }) : "next.config", _jsx("button", { className: "nd-icon-btn", onClick: cfg.reload, title: "Reload", "aria-label": "Reload config", children: _jsx(IconRefresh, {}) })] }), cfg.data && !keys.length ? (_jsx("p", { className: "nd-faint", style: { margin: 0 }, children: "Your config is empty \u2014 every option uses its default." })) : (_jsx("div", { className: "nd-json", children: cfg.data && _jsx(JsonTree, { value: cfg.data.config, open: 2 }) })), _jsxs("p", { className: "nd-faint", style: { margin: "8px 0 0" }, children: ["As resolved when ", _jsx("code", { children: "next dev" }), " started. Functions show as ", _jsx("code", { children: "\u0192 name()" }), ". Restart ", _jsx("code", { children: "next dev" }), " after editing the file."] })] }), _jsxs("div", { className: "nd-section", children: [_jsx("h3", { children: "Environment files" }), cfg.data && !cfg.data.envFiles.length && _jsx("p", { className: "nd-faint", style: { margin: 0 }, children: "No .env files loaded." }), (_f = cfg.data) === null || _f === void 0 ? void 0 : _f.envFiles.map((f) => (_jsxs("div", { style: { marginBottom: 14 }, children: [_jsx(FileLink, { loc: { file: rel(f.file), line: 1, column: 1 } }), _jsx("table", { className: "nd-kv", style: { marginTop: 4 }, children: _jsx("tbody", { children: f.vars.map((v) => (_jsxs("tr", { children: [_jsx("td", { children: v.key }), _jsx("td", { children: v.value !== undefined ? v.value : _jsx("span", { className: "nd-faint", children: "server only, value hidden" }) })] }, v.key))) }) })] }, f.file)))] })] }));
}
