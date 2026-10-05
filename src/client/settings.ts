export type EditorChoice = "server" | "vscode" | "cursor" | "windsurf" | "zed" | "webstorm";

export interface Settings {
  height: number; // px
  editor: EditorChoice;
  hideInternals: boolean;
  showButton: boolean;
  theme: "system" | "dark" | "light";
  tab: string;
  open: boolean;
}

const KEY = "next-devtools:settings";
const defaults: Settings = {
  height: 0,
  editor: "server",
  hideInternals: true,
  showButton: true,
  theme: "dark",
  tab: "overview",
  open: false,
};

let current: Settings = { ...defaults };
try {
  const raw = typeof localStorage !== "undefined" ? localStorage.getItem(KEY) : null;
  if (raw) current = { ...defaults, ...JSON.parse(raw) };
} catch {}

const listeners = new Set<(s: Settings) => void>();

export const getSettings = () => current;

export function updateSettings(patch: Partial<Settings>) {
  current = { ...current, ...patch };
  try {
    localStorage.setItem(KEY, JSON.stringify(current));
  } catch {}
  listeners.forEach((l) => l(current));
}

export function subscribeSettings(fn: (s: Settings) => void) {
  listeners.add(fn);
  return () => void listeners.delete(fn);
}
