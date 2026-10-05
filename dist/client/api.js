import { TOKEN_HEADER } from "../shared/types.js";
import { getSettings } from "./settings.js";
const PORT = process.env.NEXT_DEVTOOLS_PORT;
const TOKEN = process.env.NEXT_DEVTOOLS_TOKEN;
export const PROJECT_ROOT = process.env.NEXT_DEVTOOLS_ROOT;
export const configured = !!(PORT && TOKEN);
export class ApiError extends Error {
    constructor(message, reason) {
        super(message);
        this.reason = reason;
    }
}
async function request(path, init) {
    if (!configured) {
        throw new ApiError("withNextDevtools() isn't wrapping next.config, so the local API isn't running.", "not-configured");
    }
    let res;
    try {
        res = await fetch(`http://127.0.0.1:${PORT}${path}`, {
            ...init,
            headers: { "content-type": "application/json", [TOKEN_HEADER]: TOKEN, ...(init?.headers || {}) },
        });
    }
    catch {
        throw new ApiError(`Can't reach the DevTools API on port ${PORT}. Restart next dev, or check that nothing else uses that port.`, "unreachable");
    }
    if (res.status === 401) {
        throw new ApiError(`Port ${PORT} is answered by another project's DevTools. Set a different \`port\` in withNextDevtools().`, "unauthorized");
    }
    if (!res.ok)
        throw new ApiError(`DevTools API error ${res.status}`, "server");
    return res.json();
}
const cache = new Map();
function cached(key, fn, fresh = false) {
    if (fresh || !cache.has(key)) {
        const p = fn().catch((e) => {
            cache.delete(key);
            throw e;
        });
        cache.set(key, p);
    }
    return cache.get(key);
}
export const api = {
    info: (fresh) => cached("info", () => request("/info"), fresh),
    routes: (fresh) => cached("routes", () => request("/routes"), fresh),
    assets: (fresh) => cached("assets", () => request("/assets"), fresh),
};
export function parseSource(value) {
    if (!value)
        return null;
    const m = value.match(/^(.*):(\d+):(\d+)$/);
    if (!m)
        return { file: value, line: 1, column: 1 };
    return { file: m[1], line: Number(m[2]), column: Number(m[3]) };
}
const URL_SCHEMES = {
    vscode: "vscode://file/{abs}:{line}:{column}",
    cursor: "cursor://file/{abs}:{line}:{column}",
    windsurf: "windsurf://file/{abs}:{line}:{column}",
    zed: "zed://file/{abs}:{line}:{column}",
    webstorm: "webstorm://open?file={abs}&line={line}&column={column}",
};
/** Open a project file in the editor. Returns a short status message for a toast. */
export async function openInEditor(loc) {
    const { editor } = getSettings();
    if (editor === "server") {
        try {
            await request("/open-in-editor", { method: "POST", body: JSON.stringify(loc) });
            return `Opened ${loc.file}:${loc.line}`;
        }
        catch (e) {
            if (!PROJECT_ROOT)
                return e.message;
            // fall through to the URL scheme
        }
    }
    const scheme = URL_SCHEMES[editor === "server" ? "vscode" : editor] ?? URL_SCHEMES.vscode;
    if (!PROJECT_ROOT)
        return "Project root unknown — wrap next.config with withNextDevtools().";
    const abs = `${PROJECT_ROOT.replace(/\\/g, "/").replace(/\/$/, "")}/${loc.file}`;
    const url = scheme
        .replace("{abs}", abs.startsWith("/") ? abs.slice(1) : abs)
        .replace("{line}", String(loc.line))
        .replace("{column}", String(loc.column));
    window.location.href = url.replace("file//", "file/");
    return `Opening ${loc.file}:${loc.line}`;
}
