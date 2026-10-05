import { useEffect, useState } from "react";
import { getVitals, rate, subscribeVitals, THRESHOLDS, type Vitals } from "../vitals.js";
import { formatBytes } from "./Assets.js";

const META: { key: keyof Vitals; name: string; title: string; unit: "ms" | "" }[] = [
  { key: "lcp", name: "LCP", title: "Largest Contentful Paint", unit: "ms" },
  { key: "inp", name: "INP", title: "Interaction to Next Paint", unit: "ms" },
  { key: "cls", name: "CLS", title: "Cumulative Layout Shift", unit: "" },
  { key: "fcp", name: "FCP", title: "First Contentful Paint", unit: "ms" },
  { key: "ttfb", name: "TTFB", title: "Time to First Byte", unit: "ms" },
];

function useVitals() {
  const [v, set] = useState(getVitals);
  useEffect(() => subscribeVitals(() => set(getVitals())), []);
  return v;
}

function Phases() {
  const nav = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;
  if (!nav) return <span className="nd-faint">Navigation timing isn't available.</span>;
  const phases = [
    { name: "Redirect", start: nav.redirectStart, end: nav.redirectEnd },
    { name: "DNS", start: nav.domainLookupStart, end: nav.domainLookupEnd },
    { name: "Connect", start: nav.connectStart, end: nav.connectEnd },
    { name: "Server response", start: nav.requestStart, end: nav.responseStart },
    { name: "Download", start: nav.responseStart, end: nav.responseEnd },
    { name: "DOM parsing", start: nav.responseEnd, end: nav.domInteractive },
    { name: "Hydration window", start: nav.domInteractive, end: nav.domContentLoadedEventEnd },
    { name: "Load event", start: nav.loadEventStart, end: nav.loadEventEnd },
  ].filter((p) => p.end > 0 && p.end >= p.start);
  const total = Math.max(nav.loadEventEnd || 0, nav.domContentLoadedEventEnd, 1);
  return (
    <div className="nd-waterfall">
      {phases.map((p) => (
        <div className="nd-wf-row" key={p.name}>
          <span className="nd-muted">{p.name}</span>
          <div className="nd-wf-track">
            <div className="nd-wf-bar" style={{ left: `${(p.start / total) * 100}%`, width: `${((p.end - p.start) / total) * 100}%` }} />
          </div>
          <span>{Math.round(p.end - p.start)} ms</span>
        </div>
      ))}
    </div>
  );
}

function Resources() {
  const entries = performance.getEntriesByType("resource") as PerformanceResourceTiming[];
  const groups = new Map<string, { count: number; bytes: number; slowest: number }>();
  for (const e of entries) {
    const type = e.initiatorType === "link" && /\.css(\?|$)/.test(e.name) ? "css" : e.initiatorType || "other";
    const g = groups.get(type) ?? { count: 0, bytes: 0, slowest: 0 };
    g.count++;
    g.bytes += e.transferSize || e.encodedBodySize || 0;
    g.slowest = Math.max(g.slowest, e.duration);
    groups.set(type, g);
  }
  if (!groups.size) return <span className="nd-faint">No resources recorded yet.</span>;
  return (
    <table className="nd-table" style={{ maxWidth: 620 }}>
      <thead>
        <tr>
          <th>Type</th>
          <th>Requests</th>
          <th>Transferred</th>
          <th>Slowest</th>
        </tr>
      </thead>
      <tbody>
        {[...groups.entries()]
          .sort((a, b) => b[1].bytes - a[1].bytes)
          .map(([type, g]) => (
            <tr key={type}>
              <td className="nd-mono">{type}</td>
              <td>{g.count}</td>
              <td>{formatBytes(g.bytes)}</td>
              <td>{Math.round(g.slowest)} ms</td>
            </tr>
          ))}
      </tbody>
    </table>
  );
}

export function Performance() {
  const v = useVitals();
  const [, tick] = useState(0);
  return (
    <>
      <div className="nd-section">
        <h3>Web Vitals for this page load</h3>
        <div className="nd-vitals">
          {META.map((m) => {
            const value = v[m.key];
            const rating = value == null ? undefined : rate(m.key, value);
            const [good, poor] = THRESHOLDS[m.key];
            const pct = value == null ? 0 : Math.min(100, (value / (poor * 1.25)) * 100);
            return (
              <div className="nd-vital" key={m.key} data-rating={rating} title={`Good ≤ ${good}${m.unit}, poor > ${poor}${m.unit}`}>
                <div className="nd-vital-name">
                  <span>{m.title}</span>
                  <span className="nd-mono">{m.name}</span>
                </div>
                <div className="nd-vital-value">
                  {value == null ? <span className="nd-faint">—</span> : m.unit ? <>{Math.round(value)}<small>ms</small></> : value.toFixed(3)}
                </div>
                <div className="nd-meter">
                  <span style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
        </div>
        <p className="nd-faint" style={{ margin: "10px 0 0", maxWidth: "70ch" }}>
          Dev mode is slower than production — compare against <code>next build && next start</code> before optimizing. INP updates as you
          interact; empty values mean the browser hasn't reported them yet.
        </p>
      </div>
      <div className="nd-section">
        <h3 style={{ display: "flex", alignItems: "center", gap: 8 }}>
          Initial document load
          <button className="nd-link" style={{ fontWeight: 500 }} onClick={() => tick((n) => n + 1)}>
            Update
          </button>
        </h3>
        <Phases />
      </div>
      <div className="nd-section">
        <h3>Resources</h3>
        <Resources />
      </div>
    </>
  );
}
