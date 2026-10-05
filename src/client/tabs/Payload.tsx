import { useEffect, useState } from "react";
import { api, parseSource } from "../api.js";
import { FileLink, useAsync } from "../context.js";
import { buildTree, walkTree } from "../fiber.js";
import { JsonTree } from "../JsonTree.js";
import { IconRefresh } from "../icons.js";
import { extractParams, matchRoute } from "../nav.js";
import { serializable } from "./serializable.js";

function flightStats() {
  const chunks: unknown[] = (self as any).__next_f ?? [];
  let chars = 0;
  for (const c of chunks) if (Array.isArray(c) && typeof c[1] === "string") chars += c[1].length;
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
  const nextData = (window as any).__NEXT_DATA__;
  const appRouter = !nextData;

  // Props the server rendered the page with (React 19 dev keeps them on server component debug info)
  const serverProps: { name: string; props: unknown }[] = [];
  if (appRouter) {
    walkTree(buildTree({ hideInternals: true }), (n) => {
      if (n.kind === "server" && n.info?.props && Object.keys(n.info.props).length) {
        serverProps.push({ name: n.name, props: serializable(n.info.props) });
      }
    });
  }
  const flight = appRouter ? flightStats() : null;

  return (
    <>
      <div className="nd-section">
        <h3 style={{ display: "flex", gap: 8, alignItems: "center" }}>
          Current route
          <button className="nd-icon-btn" onClick={() => refresh((n) => n + 1)} aria-label="Refresh" title="Refresh">
            <IconRefresh />
          </button>
        </h3>
        <table className="nd-kv">
          <tbody>
            <tr>
              <td>URL</td>
              <td>{pathname + location.search}</td>
            </tr>
            <tr>
              <td>Route</td>
              <td>{route ? <>{route.route} <FileLink loc={parseSource(route.file)} /></> : <span className="nd-faint">no matching page file</span>}</td>
            </tr>
            <tr>
              <td>params</td>
              <td>{route ? JSON.stringify(extractParams(route.route, pathname)) : "{}"}</td>
            </tr>
            <tr>
              <td>searchParams</td>
              <td>{JSON.stringify(search)}</td>
            </tr>
            <tr>
              <td>Router</td>
              <td>{appRouter ? "App Router (React Server Components)" : "Pages Router"}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {nextData && (
        <div className="nd-section">
          <h3>__NEXT_DATA__</h3>
          <p className="nd-faint" style={{ margin: "0 0 8px" }}>
            {nextData.gssp ? "getServerSideProps" : nextData.isFallback ? "fallback" : nextData.gsp ? "getStaticProps" : "No data fetching method"}
            , page <code>{nextData.page}</code>, build <code>{nextData.buildId}</code>
          </p>
          <div className="nd-json">
            <JsonTree value={nextData.props?.pageProps ?? {}} name="pageProps" open={2} />
            <JsonTree value={nextData.query ?? {}} name="query" open={0} />
            <JsonTree value={nextData} name="__NEXT_DATA__" open={0} />
          </div>
        </div>
      )}

      {appRouter && (
        <div className="nd-section">
          <h3>Server Component props</h3>
          {serverProps.length ? (
            <div className="nd-json">
              {serverProps.map((p, i) => (
                <JsonTree key={i} name={p.name} value={p.props} open={i < 3 ? 1 : 0} />
              ))}
            </div>
          ) : (
            <p className="nd-faint" style={{ margin: 0 }}>Needs React 19 in development; none recorded on this page.</p>
          )}
        </div>
      )}

      {flight && (
        <div className="nd-section">
          <h3>RSC payload</h3>
          <p className="nd-muted" style={{ margin: 0 }}>
            {flight.chunks} streamed chunks, {(flight.chars / 1024).toFixed(1)} KB of Flight data inlined in the HTML for this page load.
            Client navigations fetch more — see Network.
          </p>
        </div>
      )}
    </>
  );
}
