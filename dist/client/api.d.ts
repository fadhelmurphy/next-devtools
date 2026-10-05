import { type AssetEntry, type ComponentFile, type ConfigSnapshot, type OpenResult, type PackageEntry, type ProjectInfo, type RouteEntry } from "../shared/types.js";
export declare const PROJECT_ROOT: string | undefined;
export declare const configured: boolean;
/** Base URL of the local API — the network tab hides requests to it. */
export declare const API_ORIGIN: string | null;
export declare class ApiError extends Error {
    reason: "not-configured" | "unreachable" | "unauthorized" | "server";
    constructor(message: string, reason: "not-configured" | "unreachable" | "unauthorized" | "server");
}
export declare const api: {
    info: (fresh?: boolean) => Promise<ProjectInfo>;
    routes: (fresh?: boolean) => Promise<RouteEntry[]>;
    assets: (fresh?: boolean) => Promise<AssetEntry[]>;
    components: (fresh?: boolean) => Promise<ComponentFile[]>;
    packages: (fresh?: boolean) => Promise<PackageEntry[]>;
    packagesLatest: (fresh?: boolean) => Promise<PackageEntry[]>;
    config: (fresh?: boolean) => Promise<ConfigSnapshot>;
};
export interface SourceLocation {
    file: string;
    line: number;
    column: number;
}
export declare function parseSource(value: string | null | undefined): SourceLocation | null;
/** Open a project file in the editor. Returns a short status message for a toast. */
export declare function openInEditor(loc: SourceLocation): Promise<string>;
/** Build an editor URL, translating WSL paths so a Windows editor can open them. */
export declare function editorUrl(scheme: string, abs: string, loc: SourceLocation, hints?: OpenResult): string;
