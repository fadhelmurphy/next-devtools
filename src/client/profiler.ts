/* Records how long each client component takes to render in the browser.
   Uses React's own profiling fields (actualDuration / selfBaseDuration), which
   dev builds fill in whenever the DevTools hook exists — and React Refresh puts
   it there during `next dev`. Server Components never render in the browser. */

import { getDisplayName, hasCommitHook, hostNodesOf, idOf, isComponentFiber, isForeignRoot, isNextOverlay, subscribeCommits, type Fiber } from "./fiber.js";

const PerformedWork = 1;
const ClassComponent = 1;
const HISTORY = 30;
const MAX_COMMITS = 120;

export type RenderReason =
  | { kind: "mount" }
  | { kind: "props"; keys: string[] }
  | { kind: "state"; hooks: number[] }
  | { kind: "parent" }
  | { kind: "unknown" };

export interface RenderStat {
  id: number;
  name: string;
  renders: number;
  /** Own render time of the latest render, ms */
  lastSelf: number;
  /** Latest render including children rendered in the same commit, ms */
  lastTotal: number;
  totalSelf: number;
  maxSelf: number;
  /** performance.now() of the latest render */
  lastAt: number;
  lastReason: RenderReason;
  /** Recent own render times, oldest first */
  history: number[];
  /** Latest fiber, to find DOM nodes / the tree row */
  fiber: Fiber;
}

export interface CommitStat {
  at: number;
  /** Render time of the whole committed tree, ms */
  duration: number;
  components: number;
}

const stats = new Map<number, RenderStat>();
let commits: CommitStat[] = [];
const lastStart = new WeakMap<object, number>();
const listeners = new Set<() => void>();
let installed = false;
let recording = true;
let notifyTimer: ReturnType<typeof setTimeout> | null = null;
let flash: ((elements: Element[], ms: number) => void) | null = null;
let highlight = false;

function notify() {
  if (notifyTimer) return;
  notifyTimer = setTimeout(() => {
    notifyTimer = null;
    listeners.forEach((l) => l());
  }, 200);
}

function shallowChangedKeys(a: Record<string, unknown> | null, b: Record<string, unknown> | null): string[] {
  if (a === b || !a || !b) return [];
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  return [...keys].filter((k) => !Object.is(a[k], b[k]));
}

export function reasonFor(f: Fiber): RenderReason {
  const prev = f.alternate;
  if (!prev) return { kind: "mount" };
  const props = shallowChangedKeys(prev.memoizedProps, f.memoizedProps);
  if (f.tag === ClassComponent) {
    if (prev.memoizedState !== f.memoizedState) return { kind: "state", hooks: [] };
  } else {
    const hooks: number[] = [];
    let a = prev.memoizedState;
    let b = f.memoizedState;
    for (let i = 0; a && b && i < 100; i++, a = a.next, b = b.next) {
      // Only stateful hooks (useState/useReducer) carry a queue with a dispatcher
      if (b.queue && typeof b.queue.dispatch === "function" && !Object.is(a.memoizedState, b.memoizedState)) hooks.push(i + 1);
    }
    if (hooks.length) return { kind: "state", hooks };
  }
  if (props.length) return { kind: "props", keys: props };
  return { kind: "parent" };
}

function record(f: Fiber, now: number, rendered: Fiber[], initial = false) {
  const id = idOf(f);
  const self = Math.max(0, Number(f.selfBaseDuration) || 0);
  const total = Math.max(self, Number(f.actualDuration) || 0);
  let s = stats.get(id);
  if (!s) {
    s = { id, name: getDisplayName(f), renders: 0, lastSelf: 0, lastTotal: 0, totalSelf: 0, maxSelf: 0, lastAt: 0, lastReason: { kind: "mount" }, history: [], fiber: f };
    stats.set(id, s);
  }
  s.renders++;
  s.lastSelf = self;
  s.lastTotal = total;
  s.totalSelf += self;
  s.maxSelf = Math.max(s.maxSelf, self);
  s.lastAt = now;
  s.lastReason = initial ? { kind: "mount" } : reasonFor(f);
  s.fiber = f;
  s.history.push(self);
  if (s.history.length > HISTORY) s.history.shift();
  rendered.push(f);
}

function processRoot(root: any, initial = false) {
  if (!recording || isForeignRoot(root)) return;
  const current = root?.current;
  if (!current) return;
  const now = performance.now();
  const rendered: Fiber[] = [];
  const stack: Fiber[] = current.child ? [current.child] : [];
  let guard = 0;
  while (stack.length && guard++ < 50000) {
    const f = stack.pop();
    if (f.sibling) stack.push(f.sibling);
    // Next's own portals (error overlay, route announcer) aren't the app
    if (isNextOverlay(f)) continue;
    if (f.child) stack.push(f.child);
    if (!isComponentFiber(f)) continue;
    const start = f.actualStartTime;
    if (typeof start !== "number" || start < 0) continue;
    // Visited in this commit (start changed) and actually ran (not a memo/bailout)
    if (lastStart.get(f) === start) continue;
    lastStart.set(f, start);
    if (f.alternate) lastStart.set(f.alternate, start);
    if (initial || (f.flags ?? f.effectTag ?? 0) & PerformedWork || !f.alternate) record(f, now, rendered, initial);
  }
  if (rendered.length && !initial) {
    commits.push({ at: now, duration: Math.max(0, Number(current.actualDuration) || 0), components: rendered.length });
    if (commits.length > MAX_COMMITS) commits = commits.slice(-MAX_COMMITS);
    if (highlight && flash) {
      const els: Element[] = [];
      for (const f of rendered.slice(0, 60)) hostNodesOf(f, els);
      flash(els.slice(0, 80), 700);
    }
    notify();
  }
}

/** Record what's already on screen as each component's first render. */
function seed() {
  const roots: any[] = [];
  const containers: Node[] = [document];
  const next = document.getElementById("__next");
  if (next) containers.push(next);
  document.body?.childNodes.forEach((n) => containers.push(n));
  for (const c of containers) {
    const k = Object.keys(c).find((k) => k.startsWith("__reactContainer$"));
    const hostRoot = k ? (c as any)[k] : null;
    const fiberRoot = hostRoot?.stateNode;
    if (fiberRoot && !roots.includes(fiberRoot)) roots.push(fiberRoot);
  }
  roots.forEach((r) => processRoot(r, true));
  notify();
}

export function startProfiler(onFlash: (elements: Element[], ms: number) => void): boolean {
  flash = onFlash;
  if (installed) return true;
  if (!hasCommitHook()) return false;
  installed = true;
  subscribeCommits((root) => processRoot(root));
  seed();
  return true;
}

export const profilerAvailable = () => installed;
export const getStats = () => stats;
export const getCommits = () => commits;
export const statFor = (fiber: Fiber | null | undefined) => (fiber ? stats.get(idOf(fiber)) : undefined);
export const isRecording = () => recording;
export function setRecording(on: boolean) {
  recording = on;
  notify();
}
export const isHighlighting = () => highlight;
export function setHighlight(on: boolean) {
  highlight = on;
  notify();
}
export function clearProfile() {
  stats.clear();
  commits = [];
  notify();
}
export function subscribeProfile(fn: () => void) {
  listeners.add(fn);
  return () => void listeners.delete(fn);
}

/** Browsers report time in ~0.1 ms steps outside cross-origin-isolated pages, so tiny values read as "<0.1 ms". */
export const formatMs = (ms: number) =>
  ms < 0.1 ? "<0.1 ms" : ms >= 100 ? `${Math.round(ms)} ms` : ms >= 10 ? `${ms.toFixed(1)} ms` : `${ms.toFixed(2)} ms`;

export function describeReason(r: RenderReason): string {
  switch (r.kind) {
    case "mount":
      return "First render (mount)";
    case "props":
      return `Props changed: ${r.keys.slice(0, 4).join(", ")}${r.keys.length > 4 ? ` +${r.keys.length - 4}` : ""}`;
    case "state":
      return r.hooks.length ? `State changed (hook ${r.hooks.join(", ")})` : "State changed";
    case "parent":
      return "Parent re-rendered (props were equal)";
    default:
      return "Unknown";
  }
}

/** good < 4ms, slow < 16ms (one frame), else too slow */
export const severity = (ms: number) => (ms < 4 ? "good" : ms < 16 ? "warn" : "bad");
