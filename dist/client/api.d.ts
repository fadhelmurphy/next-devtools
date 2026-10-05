import { type AssetEntry, type ProjectInfo, type RouteEntry } from "../shared/types.js";
export declare const PROJECT_ROOT: string | undefined;
export declare const configured: boolean;
export declare class ApiError extends Error {
    reason: "not-configured" | "unreachable" | "unauthorized" | "server";
    constructor(message: string, reason: "not-configured" | "unreachable" | "unauthorized" | "server");
}
export declare const api: {
    info: (fresh?: boolean) => Promise<ProjectInfo>;
    routes: (fresh?: boolean) => Promise<RouteEntry[]>;
    assets: (fresh?: boolean) => Promise<AssetEntry[]>;
};
export interface SourceLocation {
    file: string;
    line: number;
    column: number;
}
export declare function parseSource(value: string | null | undefined): SourceLocation | null;
/** Open a project file in the editor. Returns a short status message for a toast. */
export declare function openInEditor(loc: SourceLocation): Promise<string>;
