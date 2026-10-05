import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState, version as reactRuntimeVersion } from "react";
import { api, parseSource } from "../api.js";
import { ApiErrorBox, FileLink, useAsync, useDevtools } from "../context.js";
import { buildTree, walkTree } from "../fiber.js";
import { IconApi, IconAssets, IconComponents, IconOverview, IconPackages, IconRoutes, MarkLarge } from "../icons.js";
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
function Tile({ icon, value, label, onClick, accent, note }) {
    return (_jsxs("button", { className: `nd-tile${accent ? " nd-tile-accent" : ""}`, onClick: onClick, disabled: !onClick, children: [_jsx("span", { className: "nd-tile-icon", children: icon }), _jsx("span", { className: "nd-tile-value", children: value }), _jsx("span", { className: "nd-tile-label", children: label }), note && _jsx("span", { className: "nd-tile-note", children: note })] }));
}
export function Overview() {
    const { setTab } = useDevtools();
    const info = useAsync((f) => api.info(f));
    const routes = useAsync((f) => api.routes(f));
    const comps = useAsync((f) => api.components(f));
    const assets = useAsync((f) => api.assets(f));
    const pkgs = useAsync((f) => api.packagesLatest(f));
    const pathname = usePathname();
    const [onPage, setOnPage] = useState(0);
    useEffect(() => {
        let n = 0;
        walkTree(buildTree({ hideInternals: true }), () => n++);
        setOnPage(n);
    }, [pathname]);
    if (info.error)
        return _jsx(ApiErrorBox, { error: info.error });
    const d = info.data;
    const nextVersion = window.next?.version ?? d?.versions.next;
    const nextPkg = pkgs.data?.find((p) => p.name === "next");
    const updates = pkgs.data?.filter((p) => p.update).length;
    const current = routes.data ? matchRoute(routes.data, pathname) : undefined;
    const pages = routes.data?.filter((r) => r.kind === "page").length;
    const apis = routes.data?.filter((r) => r.kind === "api").length;
    const n = (v) => (v == null ? "…" : v);
    return (_jsxs("div", { className: "nd-overview", children: [_jsxs("header", { className: "nd-ov-hero", children: [_jsx(MarkLarge, {}), _jsx("h1", { children: d?.name ?? "Next DevTools" }), _jsxs("p", { children: ["Next.js ", nextVersion ?? "…", " with ", d ? (d.bundler === "turbopack" ? "Turbopack" : "webpack") : "…", ", React ", reactRuntimeVersion.split("-")[0], ", Node", " ", d?.versions.node ?? "…"] })] }), _jsxs("div", { className: "nd-tiles", children: [_jsx(Tile, { accent: true, icon: _jsx(IconOverview, {}), value: `v${nextVersion ?? "…"}`, label: "Next.js", onClick: () => setTab("packages"), note: nextPkg?.update ? `${nextPkg.latest} available` : nextPkg?.latest ? "Latest" : undefined }), _jsx(Tile, { icon: _jsx(IconRoutes, {}), value: n(pages), label: "pages", onClick: () => setTab("routes") }), _jsx(Tile, { icon: _jsx(IconComponents, {}), value: n(comps.data?.length), label: "components", onClick: () => setTab("components"), note: `${onPage} on this page` }), _jsx(Tile, { icon: _jsx(IconApi, {}), value: n(apis), label: "API routes", onClick: () => setTab("routes") }), _jsx(Tile, { icon: _jsx(IconPackages, {}), value: n(pkgs.data?.length ?? (d ? Object.keys(d.dependencies).length + Object.keys(d.devDependencies).length : undefined)), label: "packages", onClick: () => setTab("packages"), note: updates ? `${updates} updates` : undefined }), _jsx(Tile, { icon: _jsx(IconAssets, {}), value: n(assets.data?.length), label: "public assets", onClick: () => setTab("assets") })] }), _jsxs("div", { className: "nd-ov-cols", children: [_jsxs("section", { className: "nd-section", children: [_jsx("h3", { children: "This page" }), current ? (_jsxs("div", { className: "nd-chain", children: [(current.layouts ?? []).map((l) => (_jsxs("div", { className: "nd-chain-item", children: [_jsx("span", { className: "nd-badge", children: "Layout" }), _jsx(FileLink, { loc: parseSource(l) })] }, l))), _jsxs("div", { className: "nd-chain-item", "data-kind": "page", children: [_jsx("span", { className: "nd-badge nd-badge-accent", children: "Page" }), _jsx(FileLink, { loc: parseSource(current.file) }), _jsx("span", { className: "nd-faint nd-mono", children: pathname })] })] })) : (_jsxs("p", { className: "nd-muted", style: { margin: 0 }, children: [_jsx("span", { className: "nd-mono", children: pathname }), " ", routes.loading ? "…" : "doesn't match a page file."] }))] }), d && (_jsxs("section", { className: "nd-section", children: [_jsx("h3", { children: "Project" }), _jsx("table", { className: "nd-kv", children: _jsxs("tbody", { children: [_jsxs("tr", { children: [_jsx("td", { children: "Router" }), _jsx("td", { children: [d.router.app && `App (${d.router.appDir}/)`, d.router.pages && `Pages (${d.router.pagesDir}/)`].filter(Boolean).join(", ") || "None found" })] }), d.configFile && _jsxs("tr", { children: [_jsx("td", { children: "Config" }), _jsx("td", { children: _jsx(FileLink, { loc: parseSource(d.configFile) }) })] }), _jsxs("tr", { children: [_jsx("td", { children: "Middleware" }), _jsx("td", { children: d.middleware ? _jsx(FileLink, { loc: parseSource(d.middleware) }) : _jsx("span", { className: "nd-faint", children: "None" }) })] }), _jsxs("tr", { children: [_jsx("td", { children: "Instrumentation" }), _jsx("td", { children: d.instrumentation ? _jsx(FileLink, { loc: parseSource(d.instrumentation) }) : _jsx("span", { className: "nd-faint", children: "None" }) })] }), _jsxs("tr", { children: [_jsx("td", { children: "TypeScript" }), _jsx("td", { children: d.versions.typescript ?? _jsx("span", { className: "nd-faint", children: "Not used" }) })] })] }) })] }))] }), _jsxs("footer", { className: "nd-ov-links", children: [_jsx("a", { className: "nd-link", href: "https://nextjs.org/docs", target: "_blank", rel: "noreferrer", children: "Next.js docs" }), _jsx("a", { className: "nd-link", href: "https://github.com/fadhelmurphy/next-devtools/issues", target: "_blank", rel: "noreferrer", children: "Report a bug" }), _jsx("a", { className: "nd-link", href: "https://github.com/fadhelmurphy/next-devtools", target: "_blank", rel: "noreferrer", children: "Project on GitHub" }), _jsx("button", { className: "nd-link", onClick: () => setTab("settings"), children: "Settings" })] })] }));
}
