import { type ReactNode } from "react";
import { ApiError, openInEditor, type SourceLocation } from "./api.js";
import { type Settings } from "./settings.js";
export interface DevtoolsContext {
    toast: (msg: string) => void;
    open: (loc: SourceLocation | null | undefined) => void;
    /** Ask the Components tab to select the component that rendered `el`. */
    reveal: (el: Element) => void;
    pendingReveal: Element | null;
    clearReveal: () => void;
    setTab: (tab: string) => void;
    startPick: () => void;
    picking: boolean;
}
export declare const Ctx: import("react").Context<DevtoolsContext>;
export declare const useDevtools: () => DevtoolsContext;
export declare function useSettings(): Settings;
export declare function useAsync<T>(fn: (fresh: boolean) => Promise<T>, deps?: unknown[]): {
    reload: () => void;
    data?: T;
    error?: ApiError | Error;
    loading: boolean;
};
export declare function ApiErrorBox({ error }: {
    error: Error;
}): import("react").JSX.Element;
export declare function FileLink({ loc, children }: {
    loc: SourceLocation | null | undefined;
    children?: ReactNode;
}): import("react").JSX.Element | null;
export declare const openLocation: typeof openInEditor;
