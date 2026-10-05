import { useMemo, useState } from "react";
import type { PackageEntry } from "../../shared/types.js";
import { api } from "../api.js";
import { ApiErrorBox, useAsync, useDevtools } from "../context.js";
import { IconRefresh } from "../icons.js";

const UPDATE_LABEL = { major: "Major update", minor: "Minor update", patch: "Patch" } as const;

export function Packages() {
  const base = useAsync((f) => api.packages(f));
  const latest = useAsync((f) => api.packagesLatest(f));
  const { toast } = useDevtools();
  const [q, setQ] = useState("");
  const [only, setOnly] = useState<"all" | "updates">("all");

  const list: PackageEntry[] = latest.data ?? base.data ?? [];
  const updates = (latest.data ?? []).filter((p) => p.update);
  const shown = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return list.filter((p) => (only === "all" || p.update) && (!needle || p.name.toLowerCase().includes(needle)));
  }, [list, q, only]);

  if (base.error) return <ApiErrorBox error={base.error} />;

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast(`Copied: ${text}`);
    } catch {
      toast(text);
    }
  };

  return (
    <>
      <div className="nd-toolbar">
        <input className="nd-input" placeholder="Filter packages" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Filter packages" />
        <div className="nd-seg" role="group" aria-label="Show">
          <button aria-pressed={only === "all"} onClick={() => setOnly("all")}>All {list.length ? `(${list.length})` : ""}</button>
          <button aria-pressed={only === "updates"} onClick={() => setOnly("updates")}>
            Updates {latest.data ? `(${updates.length})` : ""}
          </button>
        </div>
        <button className="nd-icon-btn" onClick={latest.reload} title="Check again" aria-label="Check for updates again">
          <IconRefresh />
        </button>
        <span className="nd-faint">{latest.loading ? "Checking the npm registry…" : latest.error ? "Couldn't reach the npm registry" : ""}</span>
      </div>
      {updates.length > 1 && only === "updates" && (
        <div style={{ marginBottom: 12 }}>
          <button className="nd-btn" onClick={() => copy(`npm i ${updates.map((u) => `${u.name}@latest`).join(" ")}`)}>
            Copy upgrade command for all
          </button>
        </div>
      )}
      <table className="nd-table">
        <thead>
          <tr>
            <th>Package</th>
            <th>Installed</th>
            <th>Latest</th>
            <th>Status</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {shown.map((p) => (
            <tr key={p.kind + p.name}>
              <td>
                <a className="nd-link nd-mono" href={`https://www.npmjs.com/package/${p.name}`} target="_blank" rel="noreferrer">
                  {p.name}
                </a>
                {p.kind === "devDependency" && <span className="nd-badge" style={{ marginLeft: 6 }}>dev</span>}
              </td>
              <td className="nd-mono">{p.installed ?? <span className="nd-faint">not installed</span>}</td>
              <td className="nd-mono">{p.source === "external" ? <span className="nd-faint">{p.range}</span> : p.latest ?? <span className="nd-faint">…</span>}</td>
              <td>{p.update ? <span className={`nd-badge nd-upd-${p.update}`}>{UPDATE_LABEL[p.update]}</span> : p.latest ? <span className="nd-faint">Up to date</span> : null}</td>
              <td style={{ textAlign: "right" }}>
                {p.update && (
                  <button className="nd-link" onClick={() => copy(`npm i ${p.kind === "devDependency" ? "-D " : ""}${p.name}@latest`)}>
                    Copy upgrade command
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
