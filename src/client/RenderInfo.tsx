import { useEffect, useState } from "react";
import type { Fiber, TreeNode } from "./fiber.js";
import { describeReason, formatMs, profilerAvailable, severity, statFor, subscribeProfile, type RenderStat } from "./profiler.js";

/** Re-render when new render data arrives (throttled in the profiler). */
export function useProfileVersion() {
  const [v, set] = useState(0);
  useEffect(() => subscribeProfile(() => set((n) => n + 1)), []);
  return v;
}

function ago(at: number) {
  const s = Math.max(0, (performance.now() - at) / 1000);
  if (s < 1) return "just now";
  if (s < 60) return `${Math.round(s)}s ago`;
  if (s < 3600) return `${Math.round(s / 60)}m ago`;
  return `${Math.round(s / 3600)}h ago`;
}

export function Sparkline({ values }: { values: number[] }) {
  const max = Math.max(...values, 0.01);
  return (
    <div className="nd-spark" aria-label={`Last ${values.length} render times`}>
      {values.map((v, i) => (
        <span key={i} data-sev={severity(v)} style={{ height: `${Math.max(2, (v / max) * 28)}px` }} title={formatMs(v)} />
      ))}
    </div>
  );
}

/** The latest stat for any fiber of a client tree node. */
export function statForNode(node: TreeNode): RenderStat | undefined {
  if (node.kind !== "client") return undefined;
  return statFor(node.fibers[0] as Fiber);
}

export function RenderInfo({ node }: { node: TreeNode }) {
  useProfileVersion();
  const [, tick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => tick((n) => n + 1), 5000); // keep "x ago" fresh
    return () => clearInterval(id);
  }, []);

  if (node.kind === "server") {
    return <span className="nd-faint">Server Component: rendered on the server, so there's no browser render time.</span>;
  }
  if (!profilerAvailable()) {
    return <span className="nd-faint">Render timing needs React's DevTools hook, which wasn't found on this page.</span>;
  }
  const s = statForNode(node);
  if (!s) return <span className="nd-faint">No renders recorded yet. Interact with the page to see timings.</span>;
  const avg = s.totalSelf / s.renders;
  return (
    <div>
      <table className="nd-kv">
        <tbody>
          <tr>
            <td>Last render</td>
            <td>
              <span className={`nd-sev-${severity(s.lastSelf)}`}>{formatMs(s.lastSelf)}</span> self, {formatMs(s.lastTotal)} with children, {ago(s.lastAt)}
            </td>
          </tr>
          <tr>
            <td>Renders</td>
            <td>
              {s.renders} recorded, average {formatMs(avg)}, slowest {formatMs(s.maxSelf)}
            </td>
          </tr>
          <tr>
            <td>Why</td>
            <td>{describeReason(s.lastReason)}</td>
          </tr>
        </tbody>
      </table>
      {s.history.length > 1 && <Sparkline values={s.history} />}
    </div>
  );
}

/** Compact "0.42 ms" for tree rows. */
export function RenderBadge({ node }: { node: TreeNode }) {
  const s = statForNode(node);
  if (!s) return null;
  return (
    <span className="nd-ms" data-sev={severity(s.lastSelf)} title={`${s.renders} renders, last ${formatMs(s.lastSelf)} self (${formatMs(s.lastTotal)} with children)`}>
      {formatMs(s.lastSelf).replace(" ", "")}
    </span>
  );
}
