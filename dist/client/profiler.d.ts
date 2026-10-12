import { type Fiber } from "./fiber.js";
export type RenderReason = {
    kind: "mount";
} | {
    kind: "props";
    keys: string[];
} | {
    kind: "state";
    hooks: number[];
} | {
    kind: "parent";
} | {
    kind: "unknown";
};
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
export declare function reasonFor(f: Fiber): RenderReason;
export declare function startProfiler(onFlash: (elements: Element[], ms: number) => void): boolean;
export declare const profilerAvailable: () => boolean;
export declare const getStats: () => Map<number, RenderStat>;
export declare const getCommits: () => CommitStat[];
export declare const statFor: (fiber: Fiber | null | undefined) => RenderStat | undefined;
export declare const isRecording: () => boolean;
export declare function setRecording(on: boolean): void;
export declare const isHighlighting: () => boolean;
export declare function setHighlight(on: boolean): void;
export declare function clearProfile(): void;
export declare function subscribeProfile(fn: () => void): () => undefined;
/** Browsers report time in ~0.1 ms steps outside cross-origin-isolated pages, so tiny values read as "<0.1 ms". */
export declare const formatMs: (ms: number) => string;
export declare function describeReason(r: RenderReason): string;
/** good < 4ms, slow < 16ms (one frame), else too slow */
export declare const severity: (ms: number) => "good" | "warn" | "bad";
