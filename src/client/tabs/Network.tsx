import { useEffect, useMemo, useState } from "react";
import { JsonTree } from "../JsonTree.js";
import { clearEntries, getEntries, subscribeNetwork, type NetEntry, type RequestKind } from "../network.js";
import { formatBytes } from "./Assets.js";

const KIND_LABEL: Record<RequestKind, string> = {
  rsc: "RSC",
  action: "Server Action",
  data: "Page data",
  api: "API",
  fetch: "Fetch",
  external: "External",
  next: "Next.js",
  navigation: "Navigation",
};

const FILTERS: { id: "all" | RequestKind; label: string }[] = [
  { id: "all", label: "All" },
  { id: "rsc", label: "RSC" },
  { id: "action", label: "Actions" },
  { id: "data", label: "Page data" },
  { id: "api", label: "API" },
  { id: "fetch", label: "Fetch" },
  { id: "external", label: "External" },
  { id: "navigation", label: "Navigations" },
];

function useEntries() {
  const [list, set] = useState(getEntries);
  useEffect(() => subscribeNetwork(() => set(getEntries())), []);
  return list;
}

function tryJson(text?: string): unknown | undefined {
  if (!text) return undefined;
  try {
    return JSON.parse(text);
  } catch {
    return undefined;
  }
}

const shortUrl = (url: string) => {
  try {
    const u = new URL(url, location.href);
    return u.origin === location.origin ? u.pathname + u.search : u.host + u.pathname;
  } catch {
    return url;
  }
};

export function Network() {
  const entries = useEntries();
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["id"]>("all");
  const [showNext, setShowNext] = useState(false);
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<number | null>(null);

  const list = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return entries
      .filter((e) => (filter === "all" ? showNext || e.kind !== "next" : e.kind === filter))
      .filter((e) => !needle || e.url.toLowerCase().includes(needle))
      .slice()
      .reverse();
  }, [entries, filter, showNext, q]);
  const sel = entries.find((e) => e.id === selected);

  return (
    <div className="nd-split">
      <section className="nd-pane" aria-label="Requests">
        <div className="nd-pane-bar">
          <input className="nd-input" placeholder="Filter by URL" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Filter requests" />
          <button className="nd-btn" onClick={() => (clearEntries(), setSelected(null))}>
            Clear
          </button>
        </div>
        <div className="nd-pane-bar" style={{ paddingTop: 6, paddingBottom: 6 }}>
          <div className="nd-seg" role="group" aria-label="Request type">
            {FILTERS.map((f) => (
              <button key={f.id} aria-pressed={filter === f.id} onClick={() => setFilter(f.id)}>
                {f.label}
              </button>
            ))}
          </div>
          <label className="nd-check">
            <input type="checkbox" checked={showNext} onChange={(e) => setShowNext(e.target.checked)} />
            Next.js internals
          </label>
        </div>
        <div className="nd-pane-body" style={{ paddingTop: 0 }}>
          {!list.length ? (
            <div className="nd-empty" style={{ padding: "20px 14px" }}>
              <strong>No requests yet</strong>
              Client navigations, Server Actions, getServerSideProps data, route handlers and fetch() calls from the browser show up here as they happen.
            </div>
          ) : (
            <table className="nd-table nd-net">
              <tbody>
                {list.map((e) => (
                  <tr key={e.id} aria-selected={e.id === selected} onClick={() => setSelected(e.id)} data-kind={e.kind}>
                    <td style={{ width: 1 }}>
                      <span className={`nd-badge nd-kind-${e.kind}`}>{KIND_LABEL[e.kind]}</span>
                    </td>
                    <td className="nd-mono nd-net-url" title={e.url}>
                      {e.kind === "navigation" ? <>{e.requestHeaders?.from} → {e.url}</> : <>{e.method !== "GET" && <b>{e.method} </b>}{shortUrl(e.url)}</>}
                    </td>
                    <td className="nd-mono" style={{ width: 1, textAlign: "right" }}>
                      {e.kind === "navigation" ? "" : e.error ? <span style={{ color: "var(--bad)" }}>failed</span> : e.status ?? <span className="nd-faint">…</span>}
                    </td>
                    <td className="nd-mono nd-faint" style={{ width: 1, textAlign: "right", whiteSpace: "nowrap" }}>
                      {e.duration != null ? `${Math.round(e.duration)} ms` : ""}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>
      <section className="nd-pane" aria-label="Request details">
        <div className="nd-pane-body">{sel ? <Details e={sel} /> : <div className="nd-empty" style={{ padding: "20px 16px" }}><strong>Select a request</strong>See headers, payload and the response.</div>}</div>
      </section>
    </div>
  );
}

function Details({ e }: { e: NetEntry }) {
  const reqJson = tryJson(e.requestBody);
  const resJson = tryJson(e.responseBody);
  return (
    <div className="nd-detail">
      <h3 style={{ fontFamily: "var(--mono)", wordBreak: "break-all" }}>
        <span className={`nd-badge nd-kind-${e.kind}`}>{KIND_LABEL[e.kind]}</span> {e.method} {e.kind === "navigation" ? e.url : shortUrl(e.url)}
      </h3>
      <table className="nd-kv" style={{ marginTop: 10 }}>
        <tbody>
          {e.status != null && <tr><td>Status</td><td>{e.status}</td></tr>}
          {e.error && <tr><td>Error</td><td style={{ color: "var(--bad)" }}>{e.error}</td></tr>}
          {e.duration != null && <tr><td>Time</td><td>{Math.round(e.duration)} ms</td></tr>}
          {e.size != null && <tr><td>Size</td><td>{formatBytes(e.size)}</td></tr>}
          {e.contentType && <tr><td>Type</td><td>{e.contentType}</td></tr>}
          {e.action && <tr><td>Action ID</td><td>{e.action}</td></tr>}
        </tbody>
      </table>
      {e.requestBody && (
        <div className="nd-section">
          <h3>Request body</h3>
          {reqJson !== undefined ? <div className="nd-json"><JsonTree value={reqJson} open={2} /></div> : <pre className="nd-pre">{e.requestBody}</pre>}
        </div>
      )}
      {e.responseBody && (
        <div className="nd-section">
          <h3>Response</h3>
          {resJson !== undefined ? <div className="nd-json"><JsonTree value={resJson} open={2} /></div> : <pre className="nd-pre">{e.responseBody}</pre>}
        </div>
      )}
      {e.kind === "rsc" && !e.responseBody && (
        <p className="nd-faint">RSC responses stream React Flight data; the body isn't captured.</p>
      )}
      {e.responseHeaders && Object.keys(e.responseHeaders).length > 0 && (
        <div className="nd-section">
          <h3>Response headers</h3>
          <table className="nd-kv"><tbody>{Object.entries(e.responseHeaders).map(([k, v]) => <tr key={k}><td>{k}</td><td>{v}</td></tr>)}</tbody></table>
        </div>
      )}
      {e.kind !== "navigation" && e.requestHeaders && Object.keys(e.requestHeaders).length > 0 && (
        <div className="nd-section">
          <h3>Request headers</h3>
          <table className="nd-kv"><tbody>{Object.entries(e.requestHeaders).map(([k, v]) => <tr key={k}><td>{k}</td><td>{v}</td></tr>)}</tbody></table>
        </div>
      )}
    </div>
  );
}
