import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import { api, parseSource } from "../api.js";
import { FileLink, useAsync } from "../context.js";
import { buildTree, walkTree } from "../fiber.js";
import { JsonTree } from "../JsonTree.js";
import { IconRefresh } from "../icons.js";
import { extractParams, matchRoute } from "../nav.js";
import { serializable } from "./serializable.js";
function flightStats() {
    const chunks = self.__next_f ?? [];
    let chars = 0;
    for (const c of chunks)
        if (Array.isArray(c) && typeof c[1] === "string")
            chars += c[1].length;
    return { chunks: chunks.length, chars };
}
export function Payload() {
    const routes = useAsync((f) => api.routes(f));
    const [, refresh] = useState(0);
    useEffect(() => {
        const id = setInterval(() => refresh((n) => n + 1), 1000);
        return () => clearInterval(id);
    }, []);
    const pathname = location.pathname;
    const search = Object.fromEntries(new URLSearchParams(location.search));
    const route = routes.data ? matchRoute(routes.data, pathname) : undefined;
    const nextData = window.__NEXT_DATA__;
    const appRouter = !nextData;
    // Props the server rendered the page with (React 19 dev keeps them on server component debug info)
    const serverProps = [];
    if (appRouter) {
        walkTree(buildTree({ hideInternals: true }), (n) => {
            if (n.kind === "server" && n.info?.props && Object.keys(n.info.props).length) {
                serverProps.push({ name: n.name, props: serializable(n.info.props) });
            }
        });
    }
    const flight = appRouter ? flightStats() : null;
    return (_jsxs(_Fragment, { children: [_jsxs("div", { className: "nd-section", children: [_jsxs("h3", { style: { display: "flex", gap: 8, alignItems: "center" }, children: ["Current route", _jsx("button", { className: "nd-icon-btn", onClick: () => refresh((n) => n + 1), "aria-label": "Refresh", title: "Refresh", children: _jsx(IconRefresh, {}) })] }), _jsx("table", { className: "nd-kv", children: _jsxs("tbody", { children: [_jsxs("tr", { children: [_jsx("td", { children: "URL" }), _jsx("td", { children: pathname + location.search })] }), _jsxs("tr", { children: [_jsx("td", { children: "Route" }), _jsx("td", { children: route ? _jsxs(_Fragment, { children: [route.route, " ", _jsx(FileLink, { loc: parseSource(route.file) })] }) : _jsx("span", { className: "nd-faint", children: "no matching page file" }) })] }), _jsxs("tr", { children: [_jsx("td", { children: "params" }), _jsx("td", { children: route ? JSON.stringify(extractParams(route.route, pathname)) : "{}" })] }), _jsxs("tr", { children: [_jsx("td", { children: "searchParams" }), _jsx("td", { children: JSON.stringify(search) })] }), _jsxs("tr", { children: [_jsx("td", { children: "Router" }), _jsx("td", { children: appRouter ? "App Router (React Server Components)" : "Pages Router" })] })] }) })] }), nextData && (_jsxs("div", { className: "nd-section", children: [_jsx("h3", { children: "__NEXT_DATA__" }), _jsxs("p", { className: "nd-faint", style: { margin: "0 0 8px" }, children: [nextData.gssp ? "getServerSideProps" : nextData.isFallback ? "fallback" : nextData.gsp ? "getStaticProps" : "No data fetching method", ", page ", _jsx("code", { children: nextData.page }), ", build ", _jsx("code", { children: nextData.buildId })] }), _jsxs("div", { className: "nd-json", children: [_jsx(JsonTree, { value: nextData.props?.pageProps ?? {}, name: "pageProps", open: 2 }), _jsx(JsonTree, { value: nextData.query ?? {}, name: "query", open: 0 }), _jsx(JsonTree, { value: nextData, name: "__NEXT_DATA__", open: 0 })] })] })), appRouter && (_jsxs("div", { className: "nd-section", children: [_jsx("h3", { children: "Server Component props" }), serverProps.length ? (_jsx("div", { className: "nd-json", children: serverProps.map((p, i) => (_jsx(JsonTree, { name: p.name, value: p.props, open: i < 3 ? 1 : 0 }, i))) })) : (_jsx("p", { className: "nd-faint", style: { margin: 0 }, children: "Needs React 19 in development; none recorded on this page." }))] })), flight && (_jsxs("div", { className: "nd-section", children: [_jsx("h3", { children: "RSC payload" }), _jsxs("p", { className: "nd-muted", style: { margin: 0 }, children: [flight.chunks, " streamed chunks, ", (flight.chars / 1024).toFixed(1), " KB of Flight data inlined in the HTML for this page load. Client navigations fetch more \u2014 see Network."] })] }))] }));
}
