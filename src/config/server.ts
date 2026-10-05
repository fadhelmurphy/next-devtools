import http from "node:http";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import crypto from "node:crypto";
import { TOKEN_HEADER } from "../shared/types";
import { getProjectInfo, scanAssets } from "./project";
import { scanRoutes, resolveRouterDirs } from "./routes";
import { openInEditor } from "./editor";
import { scanComponents } from "./components";
import { listPackages } from "./packages";
import { getConfigSnapshot } from "./runtime-config";

export interface ServerOptions {
  root: string;
  port: number;
  token: string;
  editor?: string;
  pageExtensions: string[];
}

const GLOBAL_KEY = Symbol.for("next-devtools.server");

/**
 * One token per project, shared across the processes `next dev` spawns
 * (each of them evaluates next.config). Written once with `wx` so concurrent
 * writers agree on the same value.
 */
export function getOrCreateToken(root: string): string {
  const dirs = [
    path.join(root, "node_modules", ".cache", "next-devtools"),
    path.join(os.tmpdir(), "next-devtools-" + crypto.createHash("sha1").update(root).digest("hex").slice(0, 12)),
  ];
  for (const dir of dirs) {
    try {
      fs.mkdirSync(dir, { recursive: true });
      const file = path.join(dir, "token");
      try {
        const existing = fs.readFileSync(file, "utf8").trim();
        if (existing) return existing;
      } catch {}
      const token = crypto.randomBytes(24).toString("hex");
      try {
        fs.writeFileSync(file, token, { flag: "wx", mode: 0o600 });
        return token;
      } catch {
        const raced = fs.readFileSync(file, "utf8").trim();
        if (raced) return raced;
      }
    } catch {
      // try next location
    }
  }
  // Read-only filesystem: stable per project, still unguessable from a webpage.
  return crypto.createHash("sha256").update(root + os.hostname() + os.userInfo().username).digest("hex");
}

function send(res: http.ServerResponse, status: number, body: unknown) {
  res.statusCode = status;
  res.setHeader("content-type", "application/json; charset=utf-8");
  res.end(JSON.stringify(body));
}

function readBody(req: http.IncomingMessage): Promise<any> {
  return new Promise((resolve) => {
    let data = "";
    req.on("data", (c) => {
      data += c;
      if (data.length > 64 * 1024) req.destroy();
    });
    req.on("end", () => {
      try {
        resolve(data ? JSON.parse(data) : {});
      } catch {
        resolve({});
      }
    });
    req.on("error", () => resolve({}));
  });
}

/** Resolve a project-relative path and refuse anything that escapes the root. */
export function resolveInsideRoot(root: string, file: string): string | null {
  if (typeof file !== "string" || !file) return null;
  const abs = path.resolve(root, file);
  const rel = path.relative(root, abs);
  if (rel.startsWith("..") || path.isAbsolute(rel)) return null;
  return abs;
}

export function startDevtoolsServer(opts: ServerOptions): void {
  const g = globalThis as any;
  if (g[GLOBAL_KEY]) return;
  g[GLOBAL_KEY] = true;

  const server = http.createServer(async (req, res) => {
    const origin = req.headers.origin;
    if (origin) {
      res.setHeader("access-control-allow-origin", origin);
      res.setHeader("vary", "origin");
    }
    res.setHeader("access-control-allow-headers", `content-type, ${TOKEN_HEADER}`);
    res.setHeader("access-control-allow-methods", "GET, POST, OPTIONS");
    // Chrome Private Network Access (page served from a LAN IP)
    res.setHeader("access-control-allow-private-network", "true");
    if (req.method === "OPTIONS") {
      res.statusCode = 204;
      return res.end();
    }

    const url = new URL(req.url || "/", "http://localhost");
    if (url.pathname === "/ping") return send(res, 200, { ok: true, root: path.basename(opts.root) });

    if (req.headers[TOKEN_HEADER] !== opts.token) return send(res, 401, { error: "invalid token" });

    try {
      switch (url.pathname) {
        case "/info":
          return send(res, 200, getProjectInfo(opts.root, opts.pageExtensions));
        case "/routes":
          return send(res, 200, scanRoutes(opts.root, opts.pageExtensions));
        case "/assets":
          return send(res, 200, scanAssets(opts.root));
        case "/open-in-editor": {
          if (req.method !== "POST") return send(res, 405, { error: "POST only" });
          const body = await readBody(req);
          const abs = resolveInsideRoot(opts.root, body.file);
          if (!abs || !fs.existsSync(abs)) return send(res, 404, { error: "file not found in project" });
          const line = Math.max(1, Number(body.line) || 1);
          const column = Math.max(1, Number(body.column) || 1);
          return send(res, 200, await openInEditor(abs, line, column, opts.editor));
        }
        case "/components": {
          const { appDir, pagesDir } = resolveRouterDirs(opts.root);
          return send(res, 200, scanComponents(opts.root, appDir, pagesDir));
        }
        case "/packages":
          return send(res, 200, await listPackages(opts.root, url.searchParams.get("latest") === "1"));
        case "/config":
          return send(res, 200, getConfigSnapshot(opts.root));
        default:
          return send(res, 404, { error: "not found" });
      }
    } catch (err) {
      return send(res, 500, { error: String((err as Error)?.message || err) });
    }
  });

  server.on("error", (err: NodeJS.ErrnoException) => {
    if (err.code === "EADDRINUSE") {
      // Another process of this same `next dev` (or a previous run) already serves it.
      return;
    }
    console.warn(`[next-devtools] API server error: ${err.message}`);
  });

  server.listen(opts.port, "127.0.0.1", () => {
    console.log(`  \x1b[36m◆\x1b[0m Next DevTools  → press \x1b[1mShift + Alt + D\x1b[0m in the browser (API on :${opts.port})`);
  });
  server.unref();
}
