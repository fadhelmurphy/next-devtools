import { type SourceLocation } from "./api.js";
export declare function attachOverlay(container: HTMLElement): void;
export interface HighlightLabel {
    title: string;
    server?: boolean;
    tag?: string;
    source?: SourceLocation | null;
    hint?: string;
}
export declare function highlight(elements: Element[], label?: HighlightLabel): void;
export declare function hideHighlight(): void;
export type InspectorMode = "editor" | "select";
export interface PickResult {
    element: Element;
    source: SourceLocation | null;
}
export declare function describe(el: Element): HighlightLabel & {
    source: SourceLocation | null;
};
export declare function startInspector(mode: InspectorMode, onPick: (r: PickResult) => void, onExit: () => void): void;
export declare function stopInspector(): void;
export declare const inspectorActive: () => boolean;
