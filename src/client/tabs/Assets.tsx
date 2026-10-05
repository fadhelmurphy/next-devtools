import { useMemo, useState } from "react";
import type { AssetEntry } from "../../shared/types.js";
import { api } from "../api.js";
import { ApiErrorBox, useAsync, useDevtools } from "../context.js";
import { IconRefresh } from "../icons.js";

export const formatBytes = (n: number) =>
  n < 1024 ? `${n} B` : n < 1024 ** 2 ? `${(n / 1024).toFixed(1)} KB` : `${(n / 1024 ** 2).toFixed(2)} MB`;

const TYPES: { value: AssetEntry["type"] | "all"; label: string }[] = [
  { value: "all", label: "All files" },
  { value: "image", label: "Images" },
  { value: "video", label: "Video" },
  { value: "audio", label: "Audio" },
  { value: "font", label: "Fonts" },
  { value: "text", label: "Text" },
  { value: "other", label: "Other" },
];

export function Assets() {
  const assets = useAsync((f) => api.assets(f));
  const { toast, open } = useDevtools();
  const [q, setQ] = useState("");
  const [type, setType] = useState<(typeof TYPES)[number]["value"]>("all");

  const list = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return (assets.data ?? []).filter((a) => (type === "all" || a.type === type) && (!needle || a.path.toLowerCase().includes(needle)));
  }, [assets.data, q, type]);
  const total = useMemo(() => (assets.data ?? []).reduce((s, a) => s + a.size, 0), [assets.data]);

  if (assets.error) return <ApiErrorBox error={assets.error} />;

  const copy = async (a: AssetEntry) => {
    try {
      await navigator.clipboard.writeText(a.path);
      toast(`Copied ${a.path}`);
    } catch {
      toast(a.path);
    }
  };

  return (
    <>
      <div className="nd-toolbar">
        <input className="nd-input" placeholder="Filter files in public/" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Filter assets" />
        <select className="nd-select" value={type} onChange={(e) => setType(e.target.value as any)} aria-label="File type">
          {TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
        <button className="nd-icon-btn" onClick={assets.reload} title="Rescan" aria-label="Rescan public folder">
          <IconRefresh />
        </button>
        {assets.data && (
          <span className="nd-faint">
            {list.length} files, {formatBytes(total)} total
          </span>
        )}
      </div>
      {assets.data && !assets.data.length ? (
        <div className="nd-empty">
          <strong>public/ is empty</strong>
          Files you put in <code>public/</code> are served from the site root and show up here.
        </div>
      ) : (
        <div className="nd-assets">
          {list.map((a) => (
            <div key={a.path} className="nd-asset">
              <button className="nd-asset-preview" style={{ border: 0, cursor: "pointer", width: "100%" }} onClick={() => copy(a)} title="Copy URL">
                {a.type === "image" ? <img src={a.path} alt="" loading="lazy" /> : <span>{a.path.split(".").pop()}</span>}
              </button>
              <div className="nd-asset-meta">
                <div className="nd-asset-name">{a.path}</div>
                <div className="nd-asset-size" style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                  <span>{formatBytes(a.size)}</span>
                  <span style={{ display: "flex", gap: 8 }}>
                    <a className="nd-link" href={a.path} target="_blank" rel="noreferrer">
                      View
                    </a>
                    {a.type === "text" && (
                      <button className="nd-link" onClick={() => open({ file: a.file, line: 1, column: 1 })}>
                        Edit
                      </button>
                    )}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
