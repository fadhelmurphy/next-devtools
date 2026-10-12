import { useState } from "react";
import { useDevtools, useSettings } from "../context.js";
import { idOf, isInternalName } from "../fiber.js";
import {
  clearProfile,
  describeReason,
  formatMs,
  getCommits,
  getStats,
  isHighlighting,
  isRecording,
  profilerAvailable,
  setHighlight,
  setRecording,
  severity,
  type RenderStat,
} from "../profiler.js";
import { useProfileVersion } from "../RenderInfo.js";

type SortKey = "totalSelf" | "renders" | "avg" | "maxSelf" | "lastSelf" | "lastAt";

const COLUMNS: { key: SortKey; label: string }[] = [
  { key: "totalSelf", label: "Total" },
  { key: "renders", label: "Renders" },
  { key: "avg", label: "Average" },
  { key: "maxSelf", label: "Slowest" },
  { key: "lastSelf", label: "Last" },
];

const value = (s: RenderStat, k: SortKey) => (k === "avg" ? s.totalSelf / s.renders : s[k]);

export function Renders() {
  useProfileVersion();
  const { selectComponent } = useDevtools();
  const { hideInternals } = useSettings();
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<SortKey>("totalSelf");

  const commits = getCommits();
  const needle = q.trim().toLowerCase();
  const rows = [...getStats().values()]
    .filter((s) => !(hideInternals && isInternalName(s.name)))
    .filter((s) => !needle || s.name.toLowerCase().includes(needle))
    .sort((a, b) => value(b, sort) - value(a, sort))
    .slice(0, 300);

  if (!profilerAvailable()) {
    return (
      <div className="nd-empty">
        <strong>Render timing isn't available</strong>
        React's DevTools hook wasn't found on this page. It's normally installed by React Refresh during <code>next dev</code>.
      </div>
    );
  }

  const recent = commits.slice(-60);
  const lastCommit = commits[commits.length - 1];
  const maxCommit = Math.max(...recent.map((c) => c.duration), 1);

  return (
    <>
      <div className="nd-toolbar">
        <input className="nd-input" placeholder="Filter components" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Filter components" />
        <button className="nd-btn" aria-pressed={isRecording()} onClick={() => setRecording(!isRecording())}>
          {isRecording() ? "Recording" : "Paused"}
        </button>
        <button className="nd-btn" onClick={clearProfile}>
          Clear
        </button>
        <label className="nd-check">
          <input type="checkbox" checked={isHighlighting()} onChange={(e) => setHighlight(e.target.checked)} />
          Highlight renders on the page
        </label>
      </div>

      <div className="nd-section" style={{ marginTop: 0 }}>
        <h3>
          Commits{" "}
          <span className="nd-faint" style={{ fontWeight: 400 }}>
            {commits.length ? `${commits.length} recorded, last took ${formatMs(lastCommit.duration)} and rendered ${lastCommit.components} ${lastCommit.components === 1 ? "component" : "components"}` : "none since the panel opened"}
          </span>
        </h3>
        {recent.length > 0 && (
          <div className="nd-commits" aria-label="Commit durations">
            {recent.map((c, i) => (
              <span key={i} data-sev={severity(c.duration)} style={{ height: `${Math.max(2, (c.duration / maxCommit) * 44)}px` }} title={`${formatMs(c.duration)}, ${c.components} components`} />
            ))}
          </div>
        )}
      </div>

      {rows.length === 0 ? (
        <div className="nd-empty">
          <strong>No renders yet</strong>
          Click around the page; every client component that renders shows up here with its time.
        </div>
      ) : (
        <table className="nd-table nd-renders">
          <thead>
            <tr>
              <th>Component</th>
              {COLUMNS.map((c) => (
                <th key={c.key} className="nd-num">
                  <button className="nd-link" onClick={() => setSort(c.key)} aria-pressed={sort === c.key} style={{ fontWeight: sort === c.key ? 700 : 500 }}>
                    {c.label}
                  </button>
                </th>
              ))}
              <th>Last reason</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((s) => (
              <tr key={s.id} onClick={() => selectComponent(idOf(s.fiber))} title="Show in Components">
                <td className="nd-mono">{s.name}</td>
                <td className="nd-num">{formatMs(s.totalSelf)}</td>
                <td className="nd-num">{s.renders}</td>
                <td className="nd-num">{formatMs(s.totalSelf / s.renders)}</td>
                <td className="nd-num">
                  <span className={`nd-sev-${severity(s.maxSelf)}`}>{formatMs(s.maxSelf)}</span>
                </td>
                <td className="nd-num">{formatMs(s.lastSelf)}</td>
                <td className="nd-muted">{describeReason(s.lastReason)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <p className="nd-faint" style={{ margin: "12px 0 0", maxWidth: "75ch" }}>
        Times are each component's own render work in the browser, measured by React in development mode — slower than production, but good for
        comparing components and spotting needless re-renders. Server Components render on the server and don't appear here.
      </p>
    </>
  );
}
