export type EditorChoice = "server" | "vscode" | "cursor" | "windsurf" | "zed" | "webstorm";
export interface Settings {
    height: number;
    editor: EditorChoice;
    hideInternals: boolean;
    showButton: boolean;
    theme: "system" | "dark" | "light";
    tab: string;
    open: boolean;
}
export declare const getSettings: () => Settings;
export declare function updateSettings(patch: Partial<Settings>): void;
export declare function subscribeSettings(fn: (s: Settings) => void): () => undefined;
