export interface Vitals {
    ttfb?: number;
    fcp?: number;
    lcp?: number;
    cls?: number;
    inp?: number;
}
export type Rating = "good" | "needs-improvement" | "poor";
export declare const THRESHOLDS: Record<keyof Vitals, [number, number]>;
export declare const rate: (k: keyof Vitals, v: number) => Rating;
/** Path of the hard page load these numbers describe; soft navigations don't reset Web Vitals. */
export declare let measuredPath: string;
export declare function startVitals(): void;
export declare const getVitals: () => {
    ttfb?: number;
    fcp?: number;
    lcp?: number;
    cls?: number;
    inp?: number;
};
export declare function subscribeVitals(fn: () => void): () => undefined;
