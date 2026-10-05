import { Fragment, useMemo, useState } from "react";
import type { RouteEntry } from "../../shared/types.js";
import { api, parseSource } from "../api.js";
import { ApiErrorBox, FileLink, useAsync } from "../context.js";
import { IconGo, IconRefresh } from "../icons.js";
import { fillRoute, matchRoute, navigate } from "../nav.js";

function RoutePath({ route }: { route: string }) {
  if (route === "/") return <span className="nd-route">/</span>;
  return (
    <span className="nd-route">
      {route
        .split("/")
        .filter(Boolean)
        .map((seg, i) => (
          <Fragment key={i}>
            /{seg.startsWith("[") ? <span className="nd-seg-dyn">{seg}</span> : seg}
          </Fragment>
        ))}
    </span>
  );
}

function RouteRow({ r, current }: { r: RouteEntry; current: boolean }) {
  const [values, setValues] = useState<Record<string, string>>({});
  const [editing, setEditing] = useState(false);
  const dynamic = r.params.length > 0;
  const canVisit = r.kind === "page" && !r.slot;

  const go = () => {
    if (dynamic && !editing) return setEditing(true);
    navigate(fillRoute(r.route, values));
  };
  const ready = !dynamic || r.params.every((p, i) => values[p]?.trim() || (r.optionalCatchAll && i === r.params.length - 1));

  return (
    <tr data-current={current || undefined}>
      <td>
        <RoutePath route={r.route} />
        {editing && (
          <form
            className="nd-params"
            onSubmit={(e) => {
              e.preventDefault();
              if (ready) navigate(fillRoute(r.route, values));
            }}
          >
            {r.params.map((p, i) => (
              <input
                key={p}
                className="nd-input"
                placeholder={r.catchAll || (r.optionalCatchAll && i === r.params.length - 1) ? `${p} (a/b/c)` : p}
                aria-label={p}
                autoFocus={i === 0}
                value={values[p] ?? ""}
                onChange={(e) => setValues({ ...values, [p]: e.target.value })}
              />
            ))}
            <button className="nd-btn nd-btn-primary" type="submit" disabled={!ready}>
              Visit
            </button>
            <button className="nd-btn" type="button" onClick={() => setEditing(false)}>
              Cancel
            </button>
          </form>
        )}
      </td>
      <td>
        <span className={`nd-badge ${r.kind === "api" ? "" : "nd-badge-accent"}`}>{r.kind === "api" ? "API" : "Page"}</span>
        {r.slot && <span className="nd-badge" style={{ marginLeft: 4 }}>{r.slot}</span>}
        {r.intercepting && <span className="nd-badge" style={{ marginLeft: 4 }}>Intercepting</span>}
      </td>
      <td className="nd-muted">{r.router === "app" ? "App" : "Pages"}</td>
      <td>
        <FileLink loc={parseSource(r.file)} />
      </td>
      <td style={{ textAlign: "right", paddingRight: 0 }}>
        {canVisit && !editing && (
          <button className="nd-icon-btn" onClick={go} title={dynamic ? "Fill in params and visit" : "Visit"} aria-label={`Visit ${r.route}`}>
            <IconGo />
          </button>
        )}
        {r.kind === "api" && !dynamic && (
          <a className="nd-icon-btn" href={r.route} target="_blank" rel="noreferrer" title="Open in a new tab" aria-label={`Open ${r.route}`}>
            <IconGo />
          </a>
        )}
      </td>
    </tr>
  );
}

export function Routes() {
  const routes = useAsync((f) => api.routes(f));
  const [q, setQ] = useState("");
  const [kind, setKind] = useState<"all" | "page" | "api">("all");

  const pathname = window.location.pathname;
  const current = routes.data ? matchRoute(routes.data, pathname) : undefined;
  const list = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return (routes.data ?? []).filter(
      (r) => (kind === "all" || r.kind === kind) && (!needle || r.route.toLowerCase().includes(needle) || r.file.toLowerCase().includes(needle)),
    );
  }, [routes.data, q, kind]);

  if (routes.error) return <ApiErrorBox error={routes.error} />;

  return (
    <>
      <div className="nd-toolbar">
        <input className="nd-input" placeholder="Filter by path or file" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Filter routes" />
        <select className="nd-select" value={kind} onChange={(e) => setKind(e.target.value as any)} aria-label="Route type">
          <option value="all">All routes</option>
          <option value="page">Pages</option>
          <option value="api">API routes</option>
        </select>
        <button className="nd-icon-btn" onClick={routes.reload} title="Rescan" aria-label="Rescan routes">
          <IconRefresh />
        </button>
        <span className="nd-faint">{routes.data ? `${list.length} of ${routes.data.length}` : ""}</span>
      </div>
      {routes.loading && !routes.data ? (
        <p className="nd-faint">Scanning app/ and pages/…</p>
      ) : routes.data && !routes.data.length ? (
        <div className="nd-empty">
          <strong>No routes found</strong>
          Add a <code>page.tsx</code> under <code>app/</code> or a file under <code>pages/</code>.
        </div>
      ) : (
        <table className="nd-table">
          <thead>
            <tr>
              <th>Route</th>
              <th>Type</th>
              <th>Router</th>
              <th>File</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {list.map((r) => (
              <RouteRow key={r.router + r.file} r={r} current={r === current} />
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}
