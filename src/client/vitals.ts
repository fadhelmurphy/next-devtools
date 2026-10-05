/* Minimal Web Vitals collection with PerformanceObserver (no dependency). Values
   are for the initial page load; INP keeps updating as you interact. */

export interface Vitals {
  ttfb?: number;
  fcp?: number;
  lcp?: number;
  cls?: number;
  inp?: number;
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
const listeners = new Set<() => void>();
let started = false;
const emit = () => listeners.forEach((l) => l());

function observe(type: string, cb: (entries: any[]) => void, extra: Record<string, unknown> = {}) {
  try {
    const po = new PerformanceObserver((list) => cb(list.getEntries()));
    po.observe({ type, buffered: true, ...extra } as PerformanceObserverInit);
  } catch {
    // entry type not supported in this browser
  }
}

export function startVitals() {
  if (started || typeof PerformanceObserver === "undefined") return;
  started = true;

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
    if (lastEntry) {
      vitals.lcp = lastEntry.startTime;
      emit();
    }
  });

  // CLS: largest session window (gap < 1s, window < 5s)
  let session = 0, sessionStart = 0, sessionLast = 0;
  observe("layout-shift", (entries) => {
    for (const e of entries) {
      if (e.hadRecentInput) continue;
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
