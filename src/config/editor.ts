import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createRequire } from "node:module";
import launchEditor from "launch-editor";
import type { OpenResult } from "../shared/types";

const req = createRequire(typeof __filename !== "undefined" ? __filename : import.meta.url);

/** Editor CLIs we look for on PATH when no running editor can be detected. */
const PATH_EDITORS = ["code", "cursor", "windsurf", "code-insiders", "zed", "webstorm", "idea", "subl"];
/** Editors that would take over the `next dev` terminal — only used when asked for explicitly. */
const TERMINAL_EDITORS = /^(vi|vim|nvim|nano|emacs|ed|micro|hx|helix|joe|less|more)$/;

export function wslDistro(): string | undefined {
  if (process.platform !== "linux") return undefined;
  if (process.env.WSL_DISTRO_NAME) return process.env.WSL_DISTRO_NAME;
  return /microsoft/i.test(os.release()) ? "WSL" : undefined;
}

/** `/mnt/c/Users/me/app` → `C:/Users/me/app` (files on the Windows drive, opened from WSL). */
export function windowsPathOf(abs: string): string | undefined {
  const m = abs.match(/^\/mnt\/([a-z])\/(.*)$/i);
  return m ? `${m[1].toUpperCase()}:/${m[2]}` : undefined;
}

function onPath(cmd: string): boolean {
  const exts = process.platform === "win32" ? ["", ".cmd", ".exe", ".bat"] : [""];
  for (const dir of (process.env.PATH || "").split(path.delimiter)) {
    if (!dir) continue;
    for (const ext of exts) {
      try {
        if (fs.statSync(path.join(dir, cmd + ext)).isFile()) return true;
      } catch {}
    }
  }
  return false;
}

/**
 * Which editor to launch. launch-editor finds editors by scanning running
 * processes, which misses Windows editors from WSL, editors in containers and
 * editors not running yet — so fall back to well-known CLIs on PATH.
 */
export function resolveEditor(specified?: string): string | null {
  if (specified) return specified;
  if (process.env.LAUNCH_EDITOR) return process.env.LAUNCH_EDITOR;
  try {
    const guess: (e?: string) => string[] = req("launch-editor/guess");
    const [found] = guess();
    if (found && !TERMINAL_EDITORS.test(path.basename(found))) return found;
  } catch {}
  return PATH_EDITORS.find(onPath) ?? null;
}

export function openInEditor(abs: string, line: number, column: number, specified?: string): Promise<OpenResult> {
  const hints = { wsl: wslDistro(), windowsPath: windowsPathOf(abs) };
  const editor = resolveEditor(specified);
  if (!editor) {
    return Promise.resolve({
      ok: false,
      reason: "No editor found. Set LAUNCH_EDITOR (e.g. code, cursor) or pass `editor` to withNextDevtools().",
      ...hints,
    });
  }
  return new Promise((resolve) => {
    let settled = false;
    const done = (r: OpenResult) => {
      if (!settled) {
        settled = true;
        resolve(r);
      }
    };
    launchEditor(`${abs}:${line}:${column}`, editor, (_file: string, msg?: string | null) => {
      const reason = msg || `Could not run "${editor}".`;
      console.warn(`[next-devtools] ${reason}`);
      done({ ok: false, editor, reason, ...hints });
    });
    // launch-editor reports spawn failures asynchronously; give it a moment.
    setTimeout(() => done({ ok: true, editor, ...hints }), 400);
  });
}
