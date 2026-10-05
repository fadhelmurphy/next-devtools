import {
  TOKEN_HEADER,
  type AssetEntry,
  type ComponentFile,
  type ConfigSnapshot,
  type OpenResult,
  type PackageEntry,
  type ProjectInfo,
  type RouteEntry,
} from "../shared/types.js";
import { getSettings } from "./settings.js";

const PORT = process.env.NEXT_DEVTOOLS_PORT;
const TOKEN = process.env.NEXT_DEVTOOLS_TOKEN;
export const PROJECT_ROOT = process.env.NEXT_DEVTOOLS_ROOT;

export const configured = !!(PORT && TOKEN);
/** Base URL of the local API — the network tab hides requests to it. */
export const API_ORIGIN = PORT ? `http://127.0.0.1:${PORT}` : null;
/** The page's own fetch, captured before the network tab wraps it. */
const nativeFetch: typeof fetch = typeof window !== "undefined" ? window.fetch.bind(window) : fetch;

export class ApiError extends Error {
  constructor(message: string, public reason: "not-configured" | "unreachable" | "unauthorized" | "server") {
    super(message);
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  if (!configured) {
    throw new ApiError("withNextDevtools() isn't wrapping next.config, so the local API isn't running.", "not-configured");
  }
  let res: Response;
  try {
    res = await nativeFetch(`${API_ORIGIN}${path}`, {
      ...init,
      headers: { "content-type": "application/json", [TOKEN_HEADER]: TOKEN!, ...(init?.headers || {}) },
    });
  } catch {
    throw new ApiError(`Can't reach the DevTools API on port ${PORT}. Restart next dev, or check that nothing else uses that port.`, "unreachable");
  }
  if (res.status === 401) {
    throw new ApiError(`Port ${PORT} is answered by another project's DevTools. Set a different \`port\` in withNextDevtools().`, "unauthorized");
  }
  if (!res.ok) throw new ApiError(`DevTools API error ${res.status}`, "server");
  return res.json();
}

const cache = new Map<string, Promise<any>>();
function cached<T>(key: string, fn: () => Promise<T>, fresh = false): Promise<T> {
  if (fresh || !cache.has(key)) {
    const p = fn().catch((e) => {
      cache.delete(key);
      throw e;
    });
    cache.set(key, p);
  }
  return cache.get(key)!;
}

export const api = {
  info: (fresh?: boolean) => cached<ProjectInfo>("info", () => request("/info"), fresh),
  routes: (fresh?: boolean) => cached<RouteEntry[]>("routes", () => request("/routes"), fresh),
  assets: (fresh?: boolean) => cached<AssetEntry[]>("assets", () => request("/assets"), fresh),
  components: (fresh?: boolean) => cached<ComponentFile[]>("components", () => request("/components"), fresh),
  packages: (fresh?: boolean) => cached<PackageEntry[]>("packages", () => request("/packages"), fresh),
  packagesLatest: (fresh?: boolean) => cached<PackageEntry[]>("packages-latest", () => request("/packages?latest=1"), fresh),
  config: (fresh?: boolean) => cached<ConfigSnapshot>("config", () => request("/config"), fresh),
};

export interface SourceLocation {
  file: string;
  line: number;
  column: number;
}

export function parseSource(value: string | null | undefined): SourceLocation | null {
  if (!value) return null;
  const m = value.match(/^(.*):(\d+):(\d+)$/);
  if (!m) return { file: value, line: 1, column: 1 };
  return { file: m[1], line: Number(m[2]), column: Number(m[3]) };
}


/** Open a project file in the editor. Returns a short status message for a toast. */
export async function openInEditor(loc: SourceLocation): Promise<string> {
  const { editor } = getSettings();
  let hints: OpenResult | undefined;
  let why = "";
  if (editor === "server") {
    try {
      const r = await request<OpenResult>("/open-in-editor", { method: "POST", body: JSON.stringify(loc) });
      if (r.ok) return `Opened ${loc.file}:${loc.line}${r.editor ? ` in ${r.editor}` : ""}`;
      hints = r;
      why = r.reason ?? "";
    } catch (e) {
      why = (e as Error).message;
    }
  }
  if (!PROJECT_ROOT) return why || "Project root unknown — wrap next.config with withNextDevtools().";

  const scheme = editor === "server" ? "vscode" : editor;
  const url = editorUrl(scheme, `${PROJECT_ROOT.replace(/\\/g, "/").replace(/\/$/, "")}/${loc.file}`, loc, hints);
  window.location.href = url;
  return editor === "server"
    ? `No editor CLI found, so opening via ${scheme}://. Set LAUNCH_EDITOR=code (or cursor…) to open directly.`
    : `Opening ${loc.file}:${loc.line} in ${scheme}`;
}

/** Build an editor URL, translating WSL paths so a Windows editor can open them. */
export function editorUrl(scheme: string, abs: string, loc: SourceLocation, hints?: OpenResult): string {
  const { line, column } = loc;
  const vscodeLike = scheme === "vscode" || scheme === "cursor" || scheme === "windsurf";
  if (hints?.wsl && !hints.windowsPath && vscodeLike) {
    // File lives inside the Linux filesystem: open it through the WSL remote.
    return `${scheme}://vscode-remote/wsl+${encodeURIComponent(hints.wsl)}${abs}:${line}:${column}`;
  }
  const drive = abs.match(/^\/mnt\/([a-z])\/(.*)$/i);
  const target = hints?.windowsPath ?? (drive ? `${drive[1].toUpperCase()}:/${drive[2]}` : abs);
  const pathPart = target.startsWith("/") ? target.slice(1) : target;
  if (scheme === "webstorm") return `webstorm://open?file=${encodeURIComponent(target)}&line=${line}&column=${column}`;
  return `${scheme}://file/${pathPart}:${line}:${column}`;
}
