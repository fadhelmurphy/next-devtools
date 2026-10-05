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
  const nextRuntime: string | undefined = (window as any).next?.version;
  const appDirRuntime: boolean | undefined = (window as any).next?.appDir;

  if (info.error) return <ApiErrorBox error={info.error} />;

  return (
    <>
      <div className="nd-section nd-hero">
        <div>
          <h1>{d?.name ?? "Your Next.js app"}</h1>
          <p>
            {d?.version ? `v${d.version}, ` : ""}
            running Next.js {nextRuntime ?? d?.versions.next ?? "…"} with {d?.bundler === "turbopack" ? "Turbopack" : d ? "webpack" : "…"}
          </p>
        </div>
      </div>

      <div className="nd-section">
        <dl className="nd-facts" style={{ margin: 0 }}>
          <Fact label="Next.js" value={nextRuntime ?? d?.versions.next} />
          <Fact label="React" value={reactRuntimeVersion} />
          <Fact label="Node.js" value={d?.versions.node} />
          <Fact label="TypeScript" value={d ? d.versions.typescript ?? "Not used" : undefined} />
          <Fact
            label="Router"
            value={d ? [d.router.app && "App", d.router.pages && "Pages"].filter(Boolean).join(" + ") || "None found" : undefined}
          />
          <Fact label="Pages" value={pages} />
          <Fact label="API routes" value={apis} />
          <Fact label="Components on this page" value={componentCount} />
        </dl>
      </div>

      <div className="nd-section">
        <h3>This page</h3>
        {current ? (
          <div className="nd-chain">
            {(current.layouts ?? []).map((l) => (
              <div className="nd-chain-item" key={l}>
                <span className="nd-badge">Layout</span>
                <FileLink loc={parseSource(l)} />
              </div>
            ))}
            <div className="nd-chain-item" data-kind="page">
              <span className="nd-badge nd-badge-accent">{current.router === "app" ? "Page" : "Pages Router"}</span>
              <FileLink loc={parseSource(current.file)} />
              <span className="nd-faint nd-mono">{pathname}</span>
            </div>
          </div>
        ) : (
          <p className="nd-muted" style={{ margin: 0 }}>
            <span className="nd-mono">{pathname}</span>{" "}
            {routes.loading ? "…" : routes.error ? "— routes unavailable" : "doesn't match a page file."}
          </p>
        )}
        {appDirRuntime === false && d?.router.app && (
          <p className="nd-faint" style={{ margin: "8px 0 0" }}>This page is served by the Pages Router.</p>
        )}
      </div>

      {d && (
        <div className="nd-section">
          <h3>Project files</h3>
          <table className="nd-kv">
            <tbody>
              {d.configFile && <Row k="Config" v={<FileLink loc={parseSource(d.configFile)} />} />}
              {d.router.appDir && <Row k="App Router" v={d.router.appDir + "/"} />}
              {d.router.pagesDir && <Row k="Pages Router" v={d.router.pagesDir + "/"} />}
              <Row k="Middleware" v={d.middleware ? <FileLink loc={parseSource(d.middleware)} /> : <span className="nd-faint">None</span>} />
              <Row
                k="Instrumentation"
                v={d.instrumentation ? <FileLink loc={parseSource(d.instrumentation)} /> : <span className="nd-faint">None</span>}
              />
              <Row k="Root" v={d.root} />
            </tbody>
          </table>
        </div>
      )}

      {d && (
        <div className="nd-section">
          <h3>Public environment variables</h3>
          {Object.keys(d.publicEnv).length ? (
            <table className="nd-kv">
              <tbody>
                {Object.entries(d.publicEnv).map(([k, v]) => (
                  <Row key={k} k={k} v={v} />
                ))}
              </tbody>
            </table>
          ) : (
            <p className="nd-faint" style={{ margin: 0 }}>
              No <code>NEXT_PUBLIC_*</code> variables. Server-only variables are never shown here.
            </p>
          )}
        </div>
      )}

      {d && (
        <div className="nd-section">
          <h3>Dependencies</h3>
          <table className="nd-kv">
            <tbody>
              {Object.entries(d.dependencies).map(([k, v]) => (
                <Row key={k} k={k} v={v} />
              ))}
              {Object.entries(d.devDependencies).map(([k, v]) => (
                <Row key={k} k={k} v={<>{v} <span className="nd-badge">dev</span></>} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

const Fact = ({ label, value }: { label: string; value?: string | number }) => (
  <div className="nd-fact">
    <dt>{label}</dt>
    <dd>{value ?? "…"}</dd>
  </div>
);

const Row = ({ k, v }: { k: string; v: React.ReactNode }) => (
  <tr>
    <td>{k}</td>
    <td>{v}</td>
  </tr>
);
