import { api } from "../api.js";
import { ApiErrorBox, FileLink, useAsync } from "../context.js";
import { JsonTree } from "../JsonTree.js";
import { IconRefresh } from "../icons.js";

export function Config() {
  const cfg = useAsync((f) => api.config(f));
  const info = useAsync((f) => api.info(f));
  if (cfg.error) return <ApiErrorBox error={cfg.error} />;
  const root = info.data?.root?.replace(/\\/g, "/");
  const rel = (f: string) => (root && f.replace(/\\/g, "/").startsWith(root) ? f.replace(/\\/g, "/").slice(root.length + 1) : f);
  const keys = Object.keys(cfg.data?.config ?? {});

  return (
    <>
      <div className="nd-section">
        <h3 style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {info.data?.configFile ? <FileLink loc={{ file: info.data.configFile, line: 1, column: 1 }} /> : "next.config"}
          <button className="nd-icon-btn" onClick={cfg.reload} title="Reload" aria-label="Reload config">
            <IconRefresh />
          </button>
        </h3>
        {cfg.data && !keys.length ? (
          <p className="nd-faint" style={{ margin: 0 }}>Your config is empty — every option uses its default.</p>
        ) : (
          <div className="nd-json">{cfg.data && <JsonTree value={cfg.data.config} open={2} />}</div>
        )}
        <p className="nd-faint" style={{ margin: "8px 0 0" }}>
          As resolved when <code>next dev</code> started. Functions show as <code>ƒ name()</code>. Restart <code>next dev</code> after editing the file.
        </p>
      </div>

      <div className="nd-section">
        <h3>Environment files</h3>
        {cfg.data && !cfg.data.envFiles.length && <p className="nd-faint" style={{ margin: 0 }}>No .env files loaded.</p>}
        {cfg.data?.envFiles.map((f) => (
          <div key={f.file} style={{ marginBottom: 14 }}>
            <FileLink loc={{ file: rel(f.file), line: 1, column: 1 }} />
            <table className="nd-kv" style={{ marginTop: 4 }}>
              <tbody>
                {f.vars.map((v) => (
                  <tr key={v.key}>
                    <td>{v.key}</td>
                    <td>{v.value !== undefined ? v.value : <span className="nd-faint">server only, value hidden</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </div>
    </>
  );
}
