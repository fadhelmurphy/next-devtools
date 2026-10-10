export type RequestKind = "rsc" | "action" | "data" | "api" | "fetch" | "external" | "next" | "navigation";
export interface NetEntry {
    id: number;
    kind: RequestKind;
    method: string;
    url: string;
    start: number;
    duration?: number;
    status?: number;
    error?: string;
    size?: number;
    contentType?: string;
    requestHeaders?: Record<string, string>;
    responseHeaders?: Record<string, string>;
    requestBody?: string;
    responseBody?: string;
    /** Server Action id (Next-Action header) */
    action?: string;
}
export declare const getEntries: () => NetEntry[];
export declare function clearEntries(): void;
export declare function subscribeNetwork(fn: () => void): () => undefined;
export declare function classify(url: string, headers: Record<string, string>): RequestKind;
export declare function installNetworkRecorder(): void;
