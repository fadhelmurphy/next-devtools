import { useMemo, useState, type ReactNode } from "react";
import type { ComponentFile } from "../../shared/types.js";
import { api } from "../api.js";
import { ApiErrorBox, FileLink, useAsync, useDevtools } from "../context.js";
import { buildTree, walkTree } from "../fiber.js";
import { IconOpen, IconRefresh } from "../icons.js";

const ROLE_LABEL: Partial<Record<ComponentFile["role"], string>> = {
  page: "Page",
  layout: "Layout",
  template: "Template",
  loading: "Loading",
  error: "Error",
  "global-error": "Global error",
  "not-found": "Not found",
  forbidden: "Forbidden",
  unauthorized: "Unauthorized",
  default: "Default",
  "pages-special": "Pages special",
};

const RUNTIME_LABEL = { client: "Client", server: "Server", shared: "Shared" } as const;

export function ProjectComponents({ mode }: { mode: ReactNode }) {
  const comps = useAsync((f) => api.components(f));
  const { open } = useDevtools();
  const [q, setQ] = useState("");
  const [runtime, setRuntime] = useState<"all" | ComponentFile["runtime"]>("all");
  const [selected, setSelected] = useState<string | null>(null);

  // Names rendered right now, to mark "on this page"
  const onPage = useMemo(() => {
    const names = new Set<string>();
    walkTree(buildTree({ hideInternals: true }), (n) => names.add(n.name));
    return names;
  }, [comps.data]);

  const groups = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const map = new Map<string, ComponentFile[]>();
    for (const c of comps.data ?? []) {
      if (runtime !== "all" && c.runtime !== runtime) continue;
      if (needle && !c.file.toLowerCase().includes(needle) && !c.names.some((n) => n.toLowerCase().includes(needle))) continue;
      const dir = c.file.includes("/") ? c.file.slice(0, c.file.lastIndexOf("/")) : ".";
      if (!map.has(dir)) map.set(dir, []);
      map.get(dir)!.push(c);
    }
    return [...map.entries()];
  }, [comps.data, q, runtime]);

  const counts = useMemo(() => {
    const c = { client: 0, server: 0, shared: 0 };
    for (const x of comps.data ?? []) c[x.runtime]++;
    return c;
  }, [comps.data]);

  const sel = comps.data?.find((c) => c.file === selected);

  return (
    <div className="nd-split">
      <section className="nd-pane" aria-label="Component files">
        <div className="nd-pane-bar">{mode}</div>
        <div className="nd-pane-bar">
          <input className="nd-input" placeholder="Find component or file" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Find component" />
          <select className="nd-select" value={runtime} onChange={(e) => setRuntime(e.target.value as any)} aria-label="Runtime">
            <option value="all">All ({comps.data?.length ?? 0})</option>
            <option value="server">Server ({counts.server})</option>
            <option value="client">Client ({counts.client})</option>
            <option value="shared">Shared ({counts.shared})</option>
          </select>
          <button className="nd-icon-btn" onClick={comps.reload} title="Rescan" aria-label="Rescan project">
            <IconRefresh />
          </button>
        </div>
        <div className="nd-pane-body">
          {comps.error && (
            <div style={{ padding: 12 }}>
              <ApiErrorBox error={comps.error} />
            </div>
          )}
          {comps.loading && !comps.data && <p className="nd-faint" style={{ padding: "8px 14px" }}>Scanning project files…</p>}
          {groups.map(([dir, files]) => (
            <div key={dir}>
              <div className="nd-group-head">{dir}/</div>
              {files.map((c) => (
                <div
                  key={c.file}
                  className="nd-tree-row"
                  role="option"
                  aria-selected={c.file === selected}
                  style={{ paddingLeft: 14 }}
                  onClick={() => setSelected(c.file)}
                  onDoubleClick={() => open({ file: c.file, line: 1, column: 1 })}
                  title="Double-click to open in editor"
                >
                  <span className="nd-tree-name" data-plain>{c.names.join(", ")}</span>
                  <span className={`nd-badge nd-rt-${c.runtime}`}>{RUNTIME_LABEL[c.runtime]}</span>
                  {ROLE_LABEL[c.role] && <span className="nd-badge">{ROLE_LABEL[c.role]}</span>}
                  {c.names.some((n) => onPage.has(n)) && <span className="nd-dot" title="Rendered on this page" />}
                  <button
                    className="nd-row-action"
                    aria-label={`Open ${c.file} in editor`}
                    title="Open in editor"
                    onClick={(e) => {
                      e.stopPropagation();
                      open({ file: c.file, line: 1, column: 1 });
                    }}
                  >
                    <IconOpen />
                  </button>
                </div>
              ))}
            </div>
          ))}
        </div>
      </section>
      <section className="nd-pane" aria-label="Component file details">
        <div className="nd-pane-body">
          {sel ? (
            <div className="nd-detail">
              <h3>{sel.names.join(", ")}</h3>
              <div style={{ marginTop: 8, display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                <button className="nd-btn nd-btn-primary" onClick={() => open({ file: sel.file, line: 1, column: 1 })}>
                  <IconOpen /> Open in editor
                </button>
                <FileLink loc={{ file: sel.file, line: 1, column: 1 }} />
              </div>
              <table className="nd-kv" style={{ marginTop: 14 }}>
                <tbody>
                  <tr>
                    <td>Renders on</td>
                    <td>
                      {sel.runtime === "client"
                        ? sel.directive === "client"
                          ? 'Client ("use client")'
                          : "Client (Pages Router)"
                        : sel.runtime === "server"
                          ? "Server (App Router default)"
                          : "Shared — server or client, depending on who imports it"}
                    </td>
                  </tr>
                  {ROLE_LABEL[sel.role] && (
                    <tr>
                      <td>Role</td>
                      <td>{ROLE_LABEL[sel.role]} file</td>
                    </tr>
                  )}
                  <tr>
                    <td>On this page</td>
                    <td>{sel.names.some((n) => onPage.has(n)) ? "Yes" : "No"}</td>
                  </tr>
                  <tr>
                    <td>Lines</td>
                    <td>{sel.lines}</td>
                  </tr>
                </tbody>
              </table>
              <div className="nd-section">
                <h3 style={{ fontFamily: "var(--sans)", fontSize: 12.5, color: "var(--muted)" }}>Imported by {sel.usedBy.length} {sel.usedBy.length === 1 ? "file" : "files"}</h3>
                {sel.usedBy.length ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    {sel.usedBy.map((f) => (
                      <FileLink key={f} loc={{ file: f, line: 1, column: 1 }} />
                    ))}
                  </div>
                ) : (
                  <span className="nd-faint">{ROLE_LABEL[sel.role] ? "Loaded by Next.js from the file system" : "Not imported anywhere — possibly unused"}</span>
                )}
              </div>
            </div>
          ) : (
            <div className="nd-empty" style={{ padding: "20px 16px" }}>
              <strong>{comps.data ? `${comps.data.length} component files` : "Component files"}</strong>
              Every file in the project that exports a React component, with where it renders and who imports it. A dot marks components
              rendered on this page.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
