/* Minimal Web Vitals collection with PerformanceObserver (no dependency). Values
   are for the initial page load; INP keeps updating as you interact. */
import { HOST_ID } from "./fiber.js";
/** True when a layout shift happened only inside the DevTools panel itself. */
function onlyOurs(entry) {
    var _a;
    const sources = (_a = entry.sources) !== null && _a !== void 0 ? _a : [];
    if (!sources.length)
        return false;
    return sources.every((s) => {
        var _a, _b;
        const node = s.node;
        if (!node)
            return false;
        const root = (_a = node.getRootNode) === null || _a === void 0 ? void 0 : _a.call(node);
        return ((_b = root === null || root === void 0 ? void 0 : root.host) === null || _b === void 0 ? void 0 : _b.id) === HOST_ID || node.id === HOST_ID;
    });
}
export const THRESHOLDS = {
    ttfb: [800, 1800],
    fcp: [1800, 3000],
    lcp: [2500, 4000],
    cls: [0.1, 0.25],
    inp: [200, 500],
};
export const rate = (k, v) => v <= THRESHOLDS[k][0] ? "good" : v <= THRESHOLDS[k][1] ? "needs-improvement" : "poor";
const vitals = {};
/** Path of the hard page load these numbers describe; soft navigations don't reset Web Vitals. */
export let measuredPath = typeof location !== "undefined" ? location.pathname : "/";
const listeners = new Set();
let started = false;
const emit = () => listeners.forEach((l) => l());
function observe(type, cb, extra = {}) {
    var _a;
    if (!((_a = PerformanceObserver.supportedEntryTypes) === null || _a === void 0 ? void 0 : _a.includes(type)))
        return false;
    try {
        const po = new PerformanceObserver((list) => cb(list.getEntries()));
        po.observe(Object.assign({ type, buffered: true }, extra));
        return true;
    }
    catch (_b) {
        return false; // entry type not supported in this browser
    }
}
export function startVitals() {
    var _a;
    if (started || typeof PerformanceObserver === "undefined")
        return;
    started = true;
    measuredPath = location.pathname;
    const samePage = () => location.pathname === measuredPath;
    const nav = performance.getEntriesByType("navigation")[0];
    if (nav)
        vitals.ttfb = Math.max(0, nav.responseStart - (nav.activationStart || 0));
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
        var _a;
        for (const e of entries) {
            // Shifts caused by client-side navigation belong to another page, not this load.
            if (e.hadRecentInput || !samePage() || onlyOurs(e))
                continue;
            if (session && e.startTime - sessionLast < 1000 && e.startTime - sessionStart < 5000)
                session += e.value;
            else {
                session = e.value;
                sessionStart = e.startTime;
            }
            sessionLast = e.startTime;
            vitals.cls = Math.max((_a = vitals.cls) !== null && _a !== void 0 ? _a : 0, session);
        }
        emit();
    });
    // No shifts at all is a real (perfect) score, not "unknown".
    if (clsSupported)
        (_a = vitals.cls) !== null && _a !== void 0 ? _a : (vitals.cls = 0);
    // INP approximation: worst interaction latency seen so far.
    observe("event", (entries) => {
        var _a;
        for (const e of entries) {
            if (!e.interactionId)
                continue;
            vitals.inp = Math.max((_a = vitals.inp) !== null && _a !== void 0 ? _a : 0, e.duration);
        }
        emit();
    }, { durationThreshold: 16 });
    emit();
}
export const getVitals = () => (Object.assign({}, vitals));
export function subscribeVitals(fn) {
    listeners.add(fn);
    return () => void listeners.delete(fn);
}
