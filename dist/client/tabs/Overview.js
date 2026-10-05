import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useState, version as reactRuntimeVersion } from "react";
import { api, parseSource } from "../api.js";
import { ApiErrorBox, FileLink, useAsync } from "../context.js";
import { buildTree, walkTree } from "../fiber.js";
import { matchRoute } from "../nav.js";
function usePathname() {
    const [path, setPath] = useState(() => window.location.pathname);
    useEffect(() => {
        const update = () => setPath(window.location.pathname);
        const id = setInterval(update, 500); // covers pushState from either router
        window.addEventListener("popstate", update);
        return () => {
            clearInterval(id);
            window.removeEventListener("popstate", update);
        };
    }, []);
    return path;
}
export function Overview() {
    const info = useAsync((f) => api.info(f));
    const routes = useAsync((f) => api.routes(f));
    const pathname = usePathname();
    const [componentCount, setComponentCount] = useState(0);
    useEffect(() => {
        let n = 0;
        walkTree(buildTree({ hideInternals: true }), () => n++);
        setComponentCount(n);
    }, [pathname]);
    const current = routes.data ? matchRoute(routes.data, pathname) : undefined;
    const pages = routes.data?.filter((r) => r.kind === "page").length;
    const apis = routes.data?.filter((r) => r.kind === "api").length;
    const d = info.data;
    const nextRuntime = window.next?.version;
    const appDirRuntime = window.next?.appDir;
    if (info.error)
        return _jsx(ApiErrorBox, { error: info.error });
    return (_jsxs(_Fragment, { children: [_jsx("div", { className: "nd-section nd-hero", children: _jsxs("div", { children: [_jsx("h1", { children: d?.name ?? "Your Next.js app" }), _jsxs("p", { children: [d?.version ? `v${d.version}, ` : "", "running Next.js ", nextRuntime ?? d?.versions.next ?? "…", " with ", d?.bundler === "turbopack" ? "Turbopack" : d ? "webpack" : "…"] })] }) }), _jsx("div", { className: "nd-section", children: _jsxs("dl", { className: "nd-facts", style: { margin: 0 }, children: [_jsx(Fact, { label: "Next.js", value: nextRuntime ?? d?.versions.next }), _jsx(Fact, { label: "React", value: reactRuntimeVersion }), _jsx(Fact, { label: "Node.js", value: d?.versions.node }), _jsx(Fact, { label: "TypeScript", value: d ? d.versions.typescript ?? "Not used" : undefined }), _jsx(Fact, { label: "Router", value: d ? [d.router.app && "App", d.router.pages && "Pages"].filter(Boolean).join(" + ") || "None found" : undefined }), _jsx(Fact, { label: "Pages", value: pages }), _jsx(Fact, { label: "API routes", value: apis }), _jsx(Fact, { label: "Components on this page", value: componentCount })] }) }), _jsxs("div", { className: "nd-section", children: [_jsx("h3", { children: "This page" }), current ? (_jsxs("div", { className: "nd-chain", children: [(current.layouts ?? []).map((l) => (_jsxs("div", { className: "nd-chain-item", children: [_jsx("span", { className: "nd-badge", children: "Layout" }), _jsx(FileLink, { loc: parseSource(l) })] }, l))), _jsxs("div", { className: "nd-chain-item", "data-kind": "page", children: [_jsx("span", { className: "nd-badge nd-badge-accent", children: current.router === "app" ? "Page" : "Pages Router" }), _jsx(FileLink, { loc: parseSource(current.file) }), _jsx("span", { className: "nd-faint nd-mono", children: pathname })] })] })) : (_jsxs("p", { className: "nd-muted", style: { margin: 0 }, children: [_jsx("span", { className: "nd-mono", children: pathname }), " ", routes.loading ? "…" : routes.error ? "— routes unavailable" : "doesn't match a page file."] })), appDirRuntime === false && d?.router.app && (_jsx("p", { className: "nd-faint", style: { margin: "8px 0 0" }, children: "This page is served by the Pages Router." }))] }), d && (_jsxs("div", { className: "nd-section", children: [_jsx("h3", { children: "Project files" }), _jsx("table", { className: "nd-kv", children: _jsxs("tbody", { children: [d.configFile && _jsx(Row, { k: "Config", v: _jsx(FileLink, { loc: parseSource(d.configFile) }) }), d.router.appDir && _jsx(Row, { k: "App Router", v: d.router.appDir + "/" }), d.router.pagesDir && _jsx(Row, { k: "Pages Router", v: d.router.pagesDir + "/" }), _jsx(Row, { k: "Middleware", v: d.middleware ? _jsx(FileLink, { loc: parseSource(d.middleware) }) : _jsx("span", { className: "nd-faint", children: "None" }) }), _jsx(Row, { k: "Instrumentation", v: d.instrumentation ? _jsx(FileLink, { loc: parseSource(d.instrumentation) }) : _jsx("span", { className: "nd-faint", children: "None" }) }), _jsx(Row, { k: "Root", v: d.root })] }) })] })), d && (_jsxs("div", { className: "nd-section", children: [_jsx("h3", { children: "Public environment variables" }), Object.keys(d.publicEnv).length ? (_jsx("table", { className: "nd-kv", children: _jsx("tbody", { children: Object.entries(d.publicEnv).map(([k, v]) => (_jsx(Row, { k: k, v: v }, k))) }) })) : (_jsxs("p", { className: "nd-faint", style: { margin: 0 }, children: ["No ", _jsx("code", { children: "NEXT_PUBLIC_*" }), " variables. Server-only variables are never shown here."] }))] })), d && (_jsxs("div", { className: "nd-section", children: [_jsx("h3", { children: "Dependencies" }), _jsx("table", { className: "nd-kv", children: _jsxs("tbody", { children: [Object.entries(d.dependencies).map(([k, v]) => (_jsx(Row, { k: k, v: v }, k))), Object.entries(d.devDependencies).map(([k, v]) => (_jsx(Row, { k: k, v: _jsxs(_Fragment, { children: [v, " ", _jsx("span", { className: "nd-badge", children: "dev" })] }) }, k)))] }) })] }))] }));
}
const Fact = ({ label, value }) => (_jsxs("div", { className: "nd-fact", children: [_jsx("dt", { children: label }), _jsx("dd", { children: value ?? "…" })] }));
const Row = ({ k, v }) => (_jsxs("tr", { children: [_jsx("td", { children: k }), _jsx("td", { children: v })] }));
