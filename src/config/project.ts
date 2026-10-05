import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import type { AssetEntry, ProjectInfo } from "../shared/types";
import { resolveRouterDirs } from "./routes";

const toPosix = (p: string) => p.split(path.sep).join("/");

function readJson(file: string): any {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch {
    return undefined;
  }
}

function installedVersion(root: string, pkg: string): string | undefined {
  try {
    const req = createRequire(path.join(root, "package.json"));
    return readJson(req.resolve(`${pkg}/package.json`))?.version;
  } catch {
    return undefined;
  }
}

function firstExisting(root: string, names: string[]): string | undefined {
  for (const n of names) {
    if (fs.existsSync(path.join(root, n))) return n;
  }
  return undefined;
}

export function detectBundler(nextVersion?: string): "turbopack" | "webpack" {
  const argv = process.argv.join(" ");
  if (/--webpack\b/.test(argv)) return "webpack";
  if (/--turbo(pack)?\b/.test(argv) || process.env.TURBOPACK) return "turbopack";
  const major = Number((nextVersion || "0").split(".")[0]);
  // Turbopack became the default for `next dev` in Next.js 16.
  return major >= 16 ? "turbopack" : "webpack";
}

export function getProjectInfo(root: string, pageExtensions: string[]): ProjectInfo {
  const pkg = readJson(path.join(root, "package.json")) ?? {};
  const { appDir, pagesDir } = resolveRouterDirs(root);
  const next = installedVersion(root, "next");
  const exts = ["ts", "js", "mjs", "tsx", "jsx"];
  const withSrc = (base: string) => exts.flatMap((e) => [`${base}.${e}`, `src/${base}.${e}`]);

  const publicEnv: Record<string, string> = {};
  let env: Record<string, string | undefined> = process.env;
  try {
    // The process serving the API may not be the one that loaded .env files.
    const { loadEnvConfig } = createRequire(path.join(root, "package.json"))("@next/env");
    env = { ...loadEnvConfig(root, true, { info() {}, error() {} }, true).combinedEnv, ...process.env };
  } catch {}
  for (const [k, v] of Object.entries(env)) {
    // Only what Next already exposes to the browser — never server secrets.
    if (k.startsWith("NEXT_PUBLIC_") && typeof v === "string") publicEnv[k] = v;
  }

  return {
    root,
    name: pkg.name,
    version: pkg.version,
    versions: {
      next,
      react: installedVersion(root, "react"),
      reactDom: installedVersion(root, "react-dom"),
      typescript: installedVersion(root, "typescript"),
      node: process.versions.node,
    },
    bundler: detectBundler(next),
    router: {
      app: !!appDir,
      pages: !!pagesDir,
      appDir: appDir && toPosix(path.relative(root, appDir)),
      pagesDir: pagesDir && toPosix(path.relative(root, pagesDir)),
    },
    middleware: firstExisting(root, [...withSrc("proxy"), ...withSrc("middleware")]),
    instrumentation: firstExisting(root, withSrc("instrumentation")),
    srcDir: fs.existsSync(path.join(root, "src")),
    configFile: firstExisting(root, ["next.config.ts", "next.config.mjs", "next.config.js", "next.config.cjs", "next.config.mts"]),
    publicEnv,
    dependencies: pkg.dependencies ?? {},
    devDependencies: pkg.devDependencies ?? {},
    pageExtensions,
  };
}

const TYPES: Record<string, AssetEntry["type"]> = {};
for (const e of ["png", "jpg", "jpeg", "gif", "webp", "avif", "svg", "ico", "bmp"]) TYPES[e] = "image";
for (const e of ["mp4", "webm", "mov", "ogv"]) TYPES[e] = "video";
for (const e of ["mp3", "wav", "ogg", "m4a", "flac"]) TYPES[e] = "audio";
for (const e of ["woff", "woff2", "ttf", "otf", "eot"]) TYPES[e] = "font";
for (const e of ["txt", "json", "xml", "md", "csv", "webmanifest", "html", "css", "js"]) TYPES[e] = "text";

export function scanAssets(root: string, limit = 2000): AssetEntry[] {
  const publicDir = path.join(root, "public");
  const out: AssetEntry[] = [];
  const walk = (dir: string) => {
    let entries: fs.Dirent[] = [];
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const e of entries) {
      if (out.length >= limit) return;
      if (e.name.startsWith(".")) continue;
      const full = path.join(dir, e.name);
      if (e.isDirectory()) walk(full);
      else if (e.isFile()) {
        let st: fs.Stats;
        try {
          st = fs.statSync(full);
        } catch {
          continue;
        }
        const ext = path.extname(e.name).slice(1).toLowerCase();
        out.push({
          path: "/" + toPosix(path.relative(publicDir, full)),
          file: toPosix(path.relative(root, full)),
          size: st.size,
          type: TYPES[ext] ?? "other",
          mtime: st.mtimeMs,
        });
      }
    }
  };
  walk(publicDir);
  return out.sort((a, b) => a.path.localeCompare(b.path));
}
