import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { Fragment, useMemo, useState } from "react";
import { api, parseSource } from "../api.js";
import { ApiErrorBox, FileLink, useAsync } from "../context.js";
import { IconGo, IconRefresh } from "../icons.js";
import { fillRoute, matchRoute, navigate } from "../nav.js";
function RoutePath({ route }) {
    if (route === "/")
        return _jsx("span", { className: "nd-route", children: "/" });
    return (_jsx("span", { className: "nd-route", children: route
            .split("/")
            .filter(Boolean)
            .map((seg, i) => (_jsxs(Fragment, { children: ["/", seg.startsWith("[") ? _jsx("span", { className: "nd-seg-dyn", children: seg }) : seg] }, i))) }));
}
function RouteRow({ r, current }) {
    const [values, setValues] = useState({});
    const [editing, setEditing] = useState(false);
    const dynamic = r.params.length > 0;
    const canVisit = r.kind === "page" && !r.slot;
    const go = () => {
        if (dynamic && !editing)
            return setEditing(true);
        navigate(fillRoute(r.route, values));
    };
    const ready = !dynamic || r.params.every((p, i) => values[p]?.trim() || (r.optionalCatchAll && i === r.params.length - 1));
    return (_jsxs("tr", { "data-current": current || undefined, children: [_jsxs("td", { children: [_jsx(RoutePath, { route: r.route }), editing && (_jsxs("form", { className: "nd-params", onSubmit: (e) => {
                            e.preventDefault();
                            if (ready)
                                navigate(fillRoute(r.route, values));
                        }, children: [r.params.map((p, i) => (_jsx("input", { className: "nd-input", placeholder: r.catchAll || (r.optionalCatchAll && i === r.params.length - 1) ? `${p} (a/b/c)` : p, "aria-label": p, autoFocus: i === 0, value: values[p] ?? "", onChange: (e) => setValues({ ...values, [p]: e.target.value }) }, p))), _jsx("button", { className: "nd-btn nd-btn-primary", type: "submit", disabled: !ready, children: "Visit" }), _jsx("button", { className: "nd-btn", type: "button", onClick: () => setEditing(false), children: "Cancel" })] }))] }), _jsxs("td", { children: [_jsx("span", { className: `nd-badge ${r.kind === "api" ? "" : "nd-badge-accent"}`, children: r.kind === "api" ? "API" : "Page" }), r.slot && _jsx("span", { className: "nd-badge", style: { marginLeft: 4 }, children: r.slot }), r.intercepting && _jsx("span", { className: "nd-badge", style: { marginLeft: 4 }, children: "Intercepting" })] }), _jsx("td", { className: "nd-muted", children: r.router === "app" ? "App" : "Pages" }), _jsx("td", { children: _jsx(FileLink, { loc: parseSource(r.file) }) }), _jsxs("td", { style: { textAlign: "right", paddingRight: 0 }, children: [canVisit && !editing && (_jsx("button", { className: "nd-icon-btn", onClick: go, title: dynamic ? "Fill in params and visit" : "Visit", "aria-label": `Visit ${r.route}`, children: _jsx(IconGo, {}) })), r.kind === "api" && !dynamic && (_jsx("a", { className: "nd-icon-btn", href: r.route, target: "_blank", rel: "noreferrer", title: "Open in a new tab", "aria-label": `Open ${r.route}`, children: _jsx(IconGo, {}) }))] })] }));
}
export function Routes() {
    const routes = useAsync((f) => api.routes(f));
    const [q, setQ] = useState("");
    const [kind, setKind] = useState("all");
    const pathname = window.location.pathname;
    const current = routes.data ? matchRoute(routes.data, pathname) : undefined;
    const list = useMemo(() => {
        const needle = q.trim().toLowerCase();
        return (routes.data ?? []).filter((r) => (kind === "all" || r.kind === kind) && (!needle || r.route.toLowerCase().includes(needle) || r.file.toLowerCase().includes(needle)));
    }, [routes.data, q, kind]);
    if (routes.error)
        return _jsx(ApiErrorBox, { error: routes.error });
    return (_jsxs(_Fragment, { children: [_jsxs("div", { className: "nd-toolbar", children: [_jsx("input", { className: "nd-input", placeholder: "Filter by path or file", value: q, onChange: (e) => setQ(e.target.value), "aria-label": "Filter routes" }), _jsxs("select", { className: "nd-select", value: kind, onChange: (e) => setKind(e.target.value), "aria-label": "Route type", children: [_jsx("option", { value: "all", children: "All routes" }), _jsx("option", { value: "page", children: "Pages" }), _jsx("option", { value: "api", children: "API routes" })] }), _jsx("button", { className: "nd-icon-btn", onClick: routes.reload, title: "Rescan", "aria-label": "Rescan routes", children: _jsx(IconRefresh, {}) }), _jsx("span", { className: "nd-faint", children: routes.data ? `${list.length} of ${routes.data.length}` : "" })] }), routes.loading && !routes.data ? (_jsx("p", { className: "nd-faint", children: "Scanning app/ and pages/\u2026" })) : routes.data && !routes.data.length ? (_jsxs("div", { className: "nd-empty", children: [_jsx("strong", { children: "No routes found" }), "Add a ", _jsx("code", { children: "page.tsx" }), " under ", _jsx("code", { children: "app/" }), " or a file under ", _jsx("code", { children: "pages/" }), "."] })) : (_jsxs("table", { className: "nd-table", children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { children: "Route" }), _jsx("th", { children: "Type" }), _jsx("th", { children: "Router" }), _jsx("th", { children: "File" }), _jsx("th", {})] }) }), _jsx("tbody", { children: list.map((r) => (_jsx(RouteRow, { r: r, current: r === current }, r.router + r.file))) })] }))] }));
}
