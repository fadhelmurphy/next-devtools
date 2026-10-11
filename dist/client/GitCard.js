import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import { api } from "./api.js";
const UNITS = [
    ["year", 365 * 24 * 3600],
    ["month", 30 * 24 * 3600],
    ["week", 7 * 24 * 3600],
    ["day", 24 * 3600],
    ["hour", 3600],
    ["minute", 60],
];
export function timeAgo(iso, now = Date.now()) {
    const t = Date.parse(iso);
    if (!t)
        return "";
    const secs = Math.round((t - now) / 1000);
    const rtf = new Intl.RelativeTimeFormat(undefined, { numeric: "auto" });
    for (const [unit, size] of UNITS) {
        if (Math.abs(secs) >= size)
            return rtf.format(Math.round(secs / size), unit);
    }
    return rtf.format(0, "minute");
}
const fullDate = (iso) => {
    const d = new Date(iso);
    return isNaN(d.getTime()) ? iso : d.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
};
function initials(name) {
    var _a, _b;
    const parts = name.trim().split(/\s+/).filter(Boolean);
    return (((_b = (_a = parts[0]) === null || _a === void 0 ? void 0 : _a[0]) !== null && _b !== void 0 ? _b : "?") + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase();
}
function Avatar({ c }) {
    const [failed, setFailed] = useState(false);
    if (c.avatar && !failed)
        return _jsx("img", { className: "nd-avatar", src: c.avatar, alt: "", onError: () => setFailed(true) });
    return (_jsx("span", { className: "nd-avatar nd-avatar-initials", "aria-hidden": "true", children: initials(c.authorName) }));
}
function Commit({ c, label }) {
    if (c.uncommitted) {
        return (_jsxs("div", { className: "nd-commit", children: [_jsx("div", { className: "nd-commit-label", children: label }), _jsx("div", { className: "nd-commit-body", children: _jsx("span", { className: "nd-badge nd-badge-server", children: "Not committed yet" }) })] }));
    }
    const who = c.login ? `${c.authorName} (@${c.login})` : c.authorName;
    return (_jsxs("div", { className: "nd-commit", children: [_jsx("div", { className: "nd-commit-label", children: label }), _jsxs("div", { className: "nd-commit-body", children: [_jsx(Avatar, { c: c }), _jsxs("div", { className: "nd-commit-text", children: [_jsxs("div", { className: "nd-commit-who", children: [c.authorUrl ? (_jsx("a", { className: "nd-link", href: c.authorUrl, target: "_blank", rel: "noreferrer", title: c.login ? "Open profile" : `Commits by ${c.authorEmail}`, children: who })) : (_jsx("span", { title: c.authorEmail, children: who })), _jsx("time", { className: "nd-faint", dateTime: c.date, title: fullDate(c.date), children: timeAgo(c.date) })] }), _jsxs("div", { className: "nd-commit-msg", children: [c.url ? (_jsx("a", { className: "nd-commit-sha", href: c.url, target: "_blank", rel: "noreferrer", title: "Open commit", children: c.shortSha })) : (_jsx("code", { className: "nd-commit-sha", children: c.shortSha })), _jsx("span", { children: c.subject })] })] })] })] }));
}
/** Last commit for a component's file and line. */
export function GitCard({ file, line }) {
    var _a, _b;
    const [info, setInfo] = useState(null);
    const [error, setError] = useState(null);
    useEffect(() => {
        let alive = true;
        setInfo(null);
        setError(null);
        api.git(file, line).then((r) => alive && setInfo(r), (e) => alive && setError(e.message));
        return () => {
            alive = false;
        };
    }, [file, line]);
    if (error)
        return _jsx("span", { className: "nd-faint", children: error });
    if (!info)
        return _jsx("span", { className: "nd-faint", children: "Reading git history\u2026" });
    if (!info.available)
        return _jsx("span", { className: "nd-faint", children: info.reason });
    const sameCommit = info.line && info.file && info.line.sha === info.file.sha;
    return (_jsxs("div", { className: "nd-git", children: [info.state !== "clean" && (_jsx("div", { className: "nd-git-state", children: _jsx("span", { className: "nd-badge nd-badge-server", children: info.state === "untracked" ? "Untracked file" : "Uncommitted changes" }) })), info.line && !sameCommit && _jsx(Commit, { c: info.line, label: `Line ${info.lineNumber} last changed` }), info.file ? (_jsx(Commit, { c: info.file, label: sameCommit ? `Last commit (file and line ${info.lineNumber})` : "Last commit to this file" })) : (_jsx("span", { className: "nd-faint", children: "No commits for this file yet." })), info.remote && (info.remote.provider === "github" || info.remote.provider === "gitlab") && (_jsxs("div", { className: "nd-faint nd-git-foot", children: [_jsx("a", { className: "nd-link", href: `${info.remote.web}${info.remote.provider === "gitlab" ? "/-/commits" : "/commits"}/${(_a = info.branch) !== null && _a !== void 0 ? _a : "HEAD"}/${(_b = info.path) !== null && _b !== void 0 ? _b : ""}`, target: "_blank", rel: "noreferrer", children: "File history" }), " ", "on ", info.remote.path, info.branch ? ` (${info.branch})` : ""] }))] }));
}
