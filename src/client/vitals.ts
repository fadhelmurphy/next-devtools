/* Minimal Web Vitals collection with PerformanceObserver (no dependency). Values
   are for the initial page load; INP keeps updating as you interact. */

export interface Vitals {
  ttfb?: number;
  fcp?: number;
  lcp?: number;
  cls?: number;
  inp?: number;
}

import { HOST_ID } from "./fiber.js";

/** True when a layout shift happened only inside the DevTools panel itself. */
function onlyOurs(entry: any): boolean {
  const sources: any[] = entry.sources ?? [];
  if (!sources.length) return false;
  return sources.every((s) => {
    const node: Node | null = s.node;
    if (!node) return false;
    const root = node.getRootNode?.() as ShadowRoot | Document | undefined;
    return (root as ShadowRoot)?.host?.id === HOST_ID || (node as Element).id === HOST_ID;
  });
}

export type Rating = "good" | "needs-improvement" | "poor";

export const THRESHOLDS: Record<keyof Vitals, [number, number]> = {
  ttfb: [800, 1800],
  fcp: [1800, 3000],
  lcp: [2500, 4000],
  cls: [0.1, 0.25],
  inp: [200, 500],
};

export const rate = (k: keyof Vitals, v: number): Rating =>
  v <= THRESHOLDS[k][0] ? "good" : v <= THRESHOLDS[k][1] ? "needs-improvement" : "poor";

const vitals: Vitals = {};
/** Path of the hard page load these numbers describe; soft navigations don't reset Web Vitals. */
export let measuredPath = typeof location !== "undefined" ? location.pathname : "/";
const listeners = new Set<() => void>();
let started = false;
const emit = () => listeners.forEach((l) => l());

function observe(type: string, cb: (entries: any[]) => void, extra: Record<string, unknown> = {}): boolean {
  if (!PerformanceObserver.supportedEntryTypes?.includes(type)) return false;
  try {
    const po = new PerformanceObserver((list) => cb(list.getEntries()));
    po.observe({ type, buffered: true, ...extra } as PerformanceObserverInit);
    return true;
  } catch {
    return false; // entry type not supported in this browser
  }
}

export function startVitals() {
  if (started || typeof PerformanceObserver === "undefined") return;
  started = true;
  measuredPath = location.pathname;
  const samePage = () => location.pathname === measuredPath;

  const nav = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;
  if (nav) vitals.ttfb = Math.max(0, nav.responseStart - ((nav as any).activationStart || 0));

  observe("paint", (entries) => {
    const fcp = entries.find((e) => e.name === "first-contentful-paint");
    if (fcp) {
      vitals.fcp = fcp.startTime;
      emit();
    }
  });

  observe("largest-contentful-paint", (entries) => {
    const lastEntry = entries[entries.length - 1];
    if (lastEntry && samePage()) {
      vitals.lcp = lastEntry.startTime;
      emit();
    }
  });

  // CLS: largest session window (gap < 1s, window < 5s)
  let session = 0, sessionStart = 0, sessionLast = 0;
  const clsSupported = observe("layout-shift", (entries) => {
    for (const e of entries) {
      // Shifts caused by client-side navigation belong to another page, not this load.
      if (e.hadRecentInput || !samePage() || onlyOurs(e)) continue;
      if (session && e.startTime - sessionLast < 1000 && e.startTime - sessionStart < 5000) session += e.value;
      else {
        session = e.value;
        sessionStart = e.startTime;
      }
      sessionLast = e.startTime;
      vitals.cls = Math.max(vitals.cls ?? 0, session);
    }
    emit();
  });
  // No shifts at all is a real (perfect) score, not "unknown".
  if (clsSupported) vitals.cls ??= 0;

  // INP approximation: worst interaction latency seen so far.
  observe(
    "event",
    (entries) => {
      for (const e of entries) {
        if (!e.interactionId) continue;
        vitals.inp = Math.max(vitals.inp ?? 0, e.duration);
      }
      emit();
    },
    { durationThreshold: 16 },
  );
  emit();
}

export const getVitals = () => ({ ...vitals });
export function subscribeVitals(fn: () => void) {
  listeners.add(fn);
  return () => void listeners.delete(fn);
}
