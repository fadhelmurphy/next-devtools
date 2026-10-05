import { useEffect, useState, version as reactRuntimeVersion, type ReactNode } from "react";
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

function Tile({ icon, value, label, onClick, accent, note }: { icon: ReactNode; value: ReactNode; label: string; onClick?: () => void; accent?: boolean; note?: ReactNode }) {
  return (
    <button className={`nd-tile${accent ? " nd-tile-accent" : ""}`} onClick={onClick} disabled={!onClick}>
      <span className="nd-tile-icon">{icon}</span>
      <span className="nd-tile-value">{value}</span>
      <span className="nd-tile-label">{label}</span>
      {note && <span className="nd-tile-note">{note}</span>}
    </button>
  );
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

  if (info.error) return <ApiErrorBox error={info.error} />;

  const d = info.data;
  const nextVersion: string | undefined = (window as any).next?.version ?? d?.versions.next;
  const nextPkg = pkgs.data?.find((p) => p.name === "next");
  const updates = pkgs.data?.filter((p) => p.update).length;
  const current = routes.data ? matchRoute(routes.data, pathname) : undefined;
  const pages = routes.data?.filter((r) => r.kind === "page").length;
  const apis = routes.data?.filter((r) => r.kind === "api").length;
  const n = (v?: number) => (v == null ? "…" : v);

  return (
    <div className="nd-overview">
      <header className="nd-ov-hero">
        <MarkLarge />
        <h1>{d?.name ?? "Next DevTools"}</h1>
        <p>
          Next.js {nextVersion ?? "…"} with {d ? (d.bundler === "turbopack" ? "Turbopack" : "webpack") : "…"}, React {reactRuntimeVersion.split("-")[0]}, Node{" "}
          {d?.versions.node ?? "…"}
        </p>
      </header>

      <div className="nd-tiles">
        <Tile
          accent
          icon={<IconOverview />}
          value={`v${nextVersion ?? "…"}`}
          label="Next.js"
          onClick={() => setTab("packages")}
          note={nextPkg?.update ? `${nextPkg.latest} available` : nextPkg?.latest ? "Latest" : undefined}
        />
        <Tile icon={<IconRoutes />} value={n(pages)} label="pages" onClick={() => setTab("routes")} />
        <Tile icon={<IconComponents />} value={n(comps.data?.length)} label="components" onClick={() => setTab("components")} note={`${onPage} on this page`} />
        <Tile icon={<IconApi />} value={n(apis)} label="API routes" onClick={() => setTab("routes")} />
        <Tile icon={<IconPackages />} value={n(pkgs.data?.length ?? (d ? Object.keys(d.dependencies).length + Object.keys(d.devDependencies).length : undefined))} label="packages" onClick={() => setTab("packages")} note={updates ? `${updates} updates` : undefined} />
        <Tile icon={<IconAssets />} value={n(assets.data?.length)} label="public assets" onClick={() => setTab("assets")} />
      </div>

      <div className="nd-ov-cols">
        <section className="nd-section">
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
                <span className="nd-badge nd-badge-accent">Page</span>
                <FileLink loc={parseSource(current.file)} />
                <span className="nd-faint nd-mono">{pathname}</span>
              </div>
            </div>
          ) : (
            <p className="nd-muted" style={{ margin: 0 }}>
              <span className="nd-mono">{pathname}</span> {routes.loading ? "…" : "doesn't match a page file."}
            </p>
          )}
        </section>

        {d && (
          <section className="nd-section">
            <h3>Project</h3>
            <table className="nd-kv">
              <tbody>
                <tr><td>Router</td><td>{[d.router.app && `App (${d.router.appDir}/)`, d.router.pages && `Pages (${d.router.pagesDir}/)`].filter(Boolean).join(", ") || "None found"}</td></tr>
                {d.configFile && <tr><td>Config</td><td><FileLink loc={parseSource(d.configFile)} /></td></tr>}
                <tr><td>Middleware</td><td>{d.middleware ? <FileLink loc={parseSource(d.middleware)} /> : <span className="nd-faint">None</span>}</td></tr>
                <tr><td>Instrumentation</td><td>{d.instrumentation ? <FileLink loc={parseSource(d.instrumentation)} /> : <span className="nd-faint">None</span>}</td></tr>
                <tr><td>TypeScript</td><td>{d.versions.typescript ?? <span className="nd-faint">Not used</span>}</td></tr>
              </tbody>
            </table>
          </section>
        )}
      </div>

      <footer className="nd-ov-links">
        <a className="nd-link" href="https://nextjs.org/docs" target="_blank" rel="noreferrer">Next.js docs</a>
        <a className="nd-link" href="https://github.com/fadhelmurphy/next-devtools/issues" target="_blank" rel="noreferrer">Report a bug</a>
        <a className="nd-link" href="https://github.com/fadhelmurphy/next-devtools" target="_blank" rel="noreferrer">Project on GitHub</a>
        <button className="nd-link" onClick={() => setTab("settings")}>Settings</button>
      </footer>
    </div>
  );
}
