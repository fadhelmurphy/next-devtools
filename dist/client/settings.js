const KEY = "next-devtools:settings";
const defaults = {
    height: 0,
    editor: "server",
    hideInternals: true,
    showButton: true,
    theme: "dark",
    tab: "overview",
    open: false,
};
let current = Object.assign({}, defaults);
try {
    const raw = typeof localStorage !== "undefined" ? localStorage.getItem(KEY) : null;
    if (raw)
        current = Object.assign(Object.assign({}, defaults), JSON.parse(raw));
}
catch (_a) { }
const listeners = new Set();
export const getSettings = () => current;
export function updateSettings(patch) {
    current = Object.assign(Object.assign({}, current), patch);
    try {
        localStorage.setItem(KEY, JSON.stringify(current));
    }
    catch (_a) { }
    listeners.forEach((l) => l(current));
}
export function subscribeSettings(fn) {
    listeners.add(fn);
    return () => void listeners.delete(fn);
}
