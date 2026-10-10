// node_modules/tsup/assets/esm_shims.js
import path from "path";
import { fileURLToPath } from "url";
var getFilename = () => fileURLToPath(import.meta.url);
var getDirname = () => path.dirname(getFilename());
var __dirname = /* @__PURE__ */ getDirname();
var __filename = /* @__PURE__ */ getFilename();

// src/config/index.ts
import path9 from "path";
import { createRequire as createRequire5 } from "module";
import { fileURLToPath as fileURLToPath2 } from "url";

// src/config/server.ts
import http from "http";
import fs6 from "fs";
import os2 from "os";
import path8 from "path";
import crypto from "crypto";

// src/shared/types.ts
var TOKEN_HEADER = "x-next-devtools-token";

// src/config/project.ts
import fs2 from "fs";
import path3 from "path";
import { createRequire } from "module";

// src/config/routes.ts
import fs from "fs";
import path2 from "path";
var toPosix = (p) => p.split(path2.sep).join("/");
function readDir(dir) {
  try {
    return fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return [];
  }
}
function paramInfo(segments) {
  const params = [];
  let catchAll = false;
  let optionalCatchAll = false;
  for (const seg of segments) {
    let m;
    if (m = seg.match(/^\[\[\.\.\.(.+)\]\]$/)) {
      params.push(m[1]);
      optionalCatchAll = true;
    } else if (m = seg.match(/^\[\.\.\.(.+)\]$/)) {
      params.push(m[1]);
      catchAll = true;
    } else if (m = seg.match(/^\[(.+)\]$/)) {
      params.push(m[1]);
    }
  }
  return { params, catchAll, optionalCatchAll };
}
function resolveRouterDirs(root) {
  const pick = (name) => {
    for (const candidate of [path2.join(root, name), path2.join(root, "src", name)]) {
      try {
        if (fs.statSync(candidate).isDirectory()) return candidate;
      } catch {
      }
    }
    return void 0;
  };
  return { appDir: pick("app"), pagesDir: pick("pages") };
}
function scanAppRouter(root, appDir, exts) {
  const routes = [];
  const extRe = new RegExp(`^(page|route|layout)\\.(${exts.map((e) => e.replace(/\./g, "\\.")).join("|")})$`);
  const walk = (dir, segments, layouts) => {
    var _a;
    const entries = readDir(dir);
    const here2 = [...layouts];
    const layout = entries.find((e) => {
      var _a2;
      return e.isFile() && ((_a2 = extRe.exec(e.name)) == null ? void 0 : _a2[1]) === "layout";
    });
    if (layout) here2.push(toPosix(path2.relative(root, path2.join(dir, layout.name))));
    for (const e of entries) {
      if (!e.isFile()) continue;
      const kind = (_a = extRe.exec(e.name)) == null ? void 0 : _a[1];
      if (kind !== "page" && kind !== "route") continue;
      let slot;
      let intercepting = false;
      const urlSegments = [];
      for (const seg of segments) {
        if (seg.startsWith("@")) {
          slot = seg;
          continue;
        }
        const ic = seg.match(/^(\(\.{1,3}\)|\(\.\.\)(\(\.\.\))+)(.+)$/);
        if (ic) {
          intercepting = true;
          urlSegments.push(ic[3]);
          continue;
        }
        if (/^\(.+\)$/.test(seg)) continue;
        urlSegments.push(seg);
      }
      const info = paramInfo(urlSegments);
      routes.push({
        route: "/" + urlSegments.join("/"),
        file: toPosix(path2.relative(root, path2.join(dir, e.name))),
        router: "app",
        kind: kind === "route" ? "api" : "page",
        ...info,
        ...slot ? { slot } : {},
        ...intercepting ? { intercepting } : {},
        layouts: kind === "page" ? here2 : void 0
      });
    }
    for (const e of entries) {
      if (!e.isDirectory()) continue;
      if (e.name.startsWith("_") || e.name === "node_modules") continue;
      walk(path2.join(dir, e.name), [...segments, e.name], here2);
    }
  };
  walk(appDir, [], []);
  return routes;
}
function scanPagesRouter(root, pagesDir, exts) {
  const routes = [];
  const extRe = new RegExp(`\\.(${exts.map((e) => e.replace(/\./g, "\\.")).join("|")})$`);
  const walk = (dir, segments) => {
    for (const e of readDir(dir)) {
      const full = path2.join(dir, e.name);
      if (e.isDirectory()) {
        if (e.name === "node_modules") continue;
        walk(full, [...segments, e.name]);
        continue;
      }
      if (!e.isFile() || !extRe.test(e.name)) continue;
      const base = e.name.replace(extRe, "");
      if (segments.length === 0 && base.startsWith("_")) continue;
      if (/\.(test|spec)$/.test(base) || base.endsWith(".d")) continue;
      const urlSegments = base === "index" ? segments : [...segments, base];
      const info = paramInfo(urlSegments);
      routes.push({
        route: "/" + urlSegments.join("/"),
        file: toPosix(path2.relative(root, full)),
        router: "pages",
        kind: segments[0] === "api" ? "api" : "page",
        ...info
      });
    }
  };
  walk(pagesDir, []);
  return routes;
}
function scanRoutes(root, pageExtensions) {
  const { appDir, pagesDir } = resolveRouterDirs(root);
  const routes = [
    ...appDir ? scanAppRouter(root, appDir, pageExtensions) : [],
    ...pagesDir ? scanPagesRouter(root, pagesDir, pageExtensions) : []
  ];
  const weight = (r) => r.optionalCatchAll ? 3 : r.catchAll ? 2 : r.params.length ? 1 : 0;
  return routes.sort(
    (a, b) => (a.kind === b.kind ? 0 : a.kind === "page" ? -1 : 1) || a.route.localeCompare(b.route) || weight(a) - weight(b)
  );
}

// src/config/project.ts
var toPosix2 = (p) => p.split(path3.sep).join("/");
function readJson(file) {
  try {
    return JSON.parse(fs2.readFileSync(file, "utf8"));
  } catch {
    return void 0;
  }
}
function installedVersion(root, pkg) {
  var _a;
  try {
    const req2 = createRequire(path3.join(root, "package.json"));
    return (_a = readJson(req2.resolve(`${pkg}/package.json`))) == null ? void 0 : _a.version;
  } catch {
    return void 0;
  }
}
function firstExisting(root, names) {
  for (const n of names) {
    if (fs2.existsSync(path3.join(root, n))) return n;
  }
  return void 0;
}
function detectBundler(nextVersion) {
  const argv = process.argv.join(" ");
  if (/--webpack\b/.test(argv)) return "webpack";
  if (/--turbo(pack)?\b/.test(argv) || process.env.TURBOPACK) return "turbopack";
  const major = Number((nextVersion || "0").split(".")[0]);
  return major >= 16 ? "turbopack" : "webpack";
}
function getProjectInfo(root, pageExtensions) {
  const pkg = readJson(path3.join(root, "package.json")) ?? {};
  const { appDir, pagesDir } = resolveRouterDirs(root);
  const next = installedVersion(root, "next");
  const exts = ["ts", "js", "mjs", "tsx", "jsx"];
  const withSrc = (base) => exts.flatMap((e) => [`${base}.${e}`, `src/${base}.${e}`]);
  const publicEnv = {};
  let env = process.env;
  try {
    const { loadEnvConfig } = createRequire(path3.join(root, "package.json"))("@next/env");
    env = { ...loadEnvConfig(root, true, { info() {
    }, error() {
    } }, true).combinedEnv, ...process.env };
  } catch {
  }
  for (const [k, v] of Object.entries(env)) {
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
      node: process.versions.node
    },
    bundler: detectBundler(next),
    router: {
      app: !!appDir,
      pages: !!pagesDir,
      appDir: appDir && toPosix2(path3.relative(root, appDir)),
      pagesDir: pagesDir && toPosix2(path3.relative(root, pagesDir))
    },
    middleware: firstExisting(root, [...withSrc("proxy"), ...withSrc("middleware")]),
    instrumentation: firstExisting(root, withSrc("instrumentation")),
    srcDir: fs2.existsSync(path3.join(root, "src")),
    configFile: firstExisting(root, ["next.config.ts", "next.config.mjs", "next.config.js", "next.config.cjs", "next.config.mts"]),
    publicEnv,
    dependencies: pkg.dependencies ?? {},
    devDependencies: pkg.devDependencies ?? {},
    pageExtensions
  };
}
var TYPES = {};
for (const e of ["png", "jpg", "jpeg", "gif", "webp", "avif", "svg", "ico", "bmp"]) TYPES[e] = "image";
for (const e of ["mp4", "webm", "mov", "ogv"]) TYPES[e] = "video";
for (const e of ["mp3", "wav", "ogg", "m4a", "flac"]) TYPES[e] = "audio";
for (const e of ["woff", "woff2", "ttf", "otf", "eot"]) TYPES[e] = "font";
for (const e of ["txt", "json", "xml", "md", "csv", "webmanifest", "html", "css", "js"]) TYPES[e] = "text";
function scanAssets(root, limit = 2e3) {
  const publicDir = path3.join(root, "public");
  const out = [];
  const walk = (dir) => {
    let entries = [];
    try {
      entries = fs2.readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const e of entries) {
      if (out.length >= limit) return;
      if (e.name.startsWith(".")) continue;
      const full = path3.join(dir, e.name);
      if (e.isDirectory()) walk(full);
      else if (e.isFile()) {
        let st;
        try {
          st = fs2.statSync(full);
        } catch {
          continue;
        }
        const ext = path3.extname(e.name).slice(1).toLowerCase();
        out.push({
          path: "/" + toPosix2(path3.relative(publicDir, full)),
          file: toPosix2(path3.relative(root, full)),
          size: st.size,
          type: TYPES[ext] ?? "other",
          mtime: st.mtimeMs
        });
      }
    }
  };
  walk(publicDir);
  return out.sort((a, b) => a.path.localeCompare(b.path));
}

// src/config/editor.ts
import fs3 from "fs";
import os from "os";
import path4 from "path";
import { createRequire as createRequire2 } from "module";
import launchEditor from "launch-editor";
var req = createRequire2(typeof __filename !== "undefined" ? __filename : import.meta.url);
var PATH_EDITORS = ["code", "cursor", "windsurf", "code-insiders", "zed", "webstorm", "idea", "subl"];
var TERMINAL_EDITORS = /^(vi|vim|nvim|nano|emacs|ed|micro|hx|helix|joe|less|more)$/;
function wslDistro() {
  if (process.platform !== "linux") return void 0;
  if (process.env.WSL_DISTRO_NAME) return process.env.WSL_DISTRO_NAME;
  return /microsoft/i.test(os.release()) ? "WSL" : void 0;
}
function windowsPathOf(abs) {
  const m = abs.match(/^\/mnt\/([a-z])\/(.*)$/i);
  return m ? `${m[1].toUpperCase()}:/${m[2]}` : void 0;
}
function onPath(cmd) {
  const exts = process.platform === "win32" ? ["", ".cmd", ".exe", ".bat"] : [""];
  for (const dir of (process.env.PATH || "").split(path4.delimiter)) {
    if (!dir) continue;
    for (const ext of exts) {
      try {
        if (fs3.statSync(path4.join(dir, cmd + ext)).isFile()) return true;
      } catch {
      }
    }
  }
  return false;
}
function resolveEditor(specified) {
  if (specified) return specified;
  if (process.env.LAUNCH_EDITOR) return process.env.LAUNCH_EDITOR;
  try {
    const guess = req("launch-editor/guess");
    const [found] = guess();
    if (found && !TERMINAL_EDITORS.test(path4.basename(found))) return found;
  } catch {
  }
  return PATH_EDITORS.find(onPath) ?? null;
}
function openInEditor(abs, line, column, specified) {
  const hints = { wsl: wslDistro(), windowsPath: windowsPathOf(abs) };
  const editor = resolveEditor(specified);
  if (!editor) {
    return Promise.resolve({
      ok: false,
      reason: "No editor found. Set LAUNCH_EDITOR (e.g. code, cursor) or pass `editor` to withNextDevtools().",
      ...hints
    });
  }
  return new Promise((resolve) => {
    let settled = false;
    const done = (r) => {
      if (!settled) {
        settled = true;
        resolve(r);
      }
    };
    launchEditor(`${abs}:${line}:${column}`, editor, (_file, msg) => {
      const reason = msg || `Could not run "${editor}".`;
      console.warn(`[next-devtools] ${reason}`);
      done({ ok: false, editor, reason, ...hints });
    });
    setTimeout(() => done({ ok: true, editor, ...hints }), 400);
  });
}

// src/config/components.ts
import fs4 from "fs";
import path5 from "path";
var toPosix3 = (p) => p.split(path5.sep).join("/");
var SKIP_DIRS = /* @__PURE__ */ new Set(["node_modules", ".next", ".git", "public", "dist", "out", "build", "coverage", ".turbo", ".vercel", "storybook-static"]);
var EXT_RE = /\.(tsx|jsx|js|mjs)$/;
var MAX_FILES = 3e3;
var MAX_SIZE = 300 * 1024;
var APP_SPECIAL = /^(page|layout|template|loading|error|global-error|not-found|forbidden|unauthorized|default)$/;
function stripJsonc(src) {
  let out = "";
  for (let i = 0; i < src.length; i++) {
    const ch = src[i];
    if (ch === '"') {
      let j = i + 1;
      while (j < src.length && src[j] !== '"') j += src[j] === "\\" ? 2 : 1;
      out += src.slice(i, j + 1);
      i = j;
    } else if (ch === "/" && src[i + 1] === "/") {
      while (i < src.length && src[i] !== "\n") i++;
      out += "\n";
    } else if (ch === "/" && src[i + 1] === "*") {
      i = src.indexOf("*/", i + 2);
      if (i === -1) break;
      i++;
    } else out += ch;
  }
  return out.replace(/,(\s*[}\]])/g, "$1");
}
function readTsPaths(root) {
  for (const name of ["tsconfig.json", "jsconfig.json"]) {
    try {
      const raw = stripJsonc(fs4.readFileSync(path5.join(root, name), "utf8"));
      const co = JSON.parse(raw).compilerOptions ?? {};
      return { baseUrl: path5.resolve(root, co.baseUrl ?? "."), paths: co.paths ?? {} };
    } catch {
    }
  }
  return { baseUrl: root, paths: {} };
}
function resolveImport(spec, fromFile, ts, known) {
  let bases = [];
  if (spec.startsWith(".")) bases = [path5.resolve(path5.dirname(fromFile), spec)];
  else {
    for (const [pattern, targets] of Object.entries(ts.paths)) {
      const prefix = pattern.replace(/\*$/, "");
      if (pattern.endsWith("*") ? spec.startsWith(prefix) : spec === pattern) {
        const rest = pattern.endsWith("*") ? spec.slice(prefix.length) : "";
        bases.push(...targets.map((t) => path5.resolve(ts.baseUrl, t.replace(/\*$/, rest))));
      }
    }
  }
  for (const base of bases) {
    for (const cand of [base, ...["tsx", "ts", "jsx", "js", "mjs"].flatMap((e) => [`${base}.${e}`, path5.join(base, `index.${e}`)])]) {
      if (known.has(cand)) return cand;
    }
  }
  return null;
}
function exportedComponents(code, file) {
  var _a;
  const names = /* @__PURE__ */ new Set();
  const patterns = [
    /export\s+default\s+(?:async\s+)?function\s+([A-Z]\w*)/g,
    /export\s+(?:async\s+)?function\s+([A-Z]\w*)/g,
    /export\s+const\s+([A-Z]\w*)\s*(?::[^=]+)?=\s*(?:React\.)?(?:memo|forwardRef|async|\(|function)/g,
    /export\s+class\s+([A-Z]\w*)\s+extends\s+(?:React\.)?(?:Pure)?Component/g,
    /export\s+default\s+([A-Z]\w*)\s*;?\s*$/gm,
    /export\s*\{([^}]+)\}/g
  ];
  for (const re of patterns) {
    for (const m of code.matchAll(re)) {
      if (re.source.startsWith("export\\s*\\{")) {
        for (const part of m[1].split(",")) {
          const n = (_a = part.trim().split(/\s+as\s+/).pop()) == null ? void 0 : _a.trim();
          if (n && /^[A-Z]\w*$/.test(n)) names.add(n);
        }
      } else names.add(m[1]);
    }
  }
  if (!names.size && /export\s+default\s+(?:async\s+)?(?:function\s*\(|\(|async\s*\()/.test(code)) {
    const base = path5.basename(file).replace(EXT_RE, "");
    names.add(base === "index" ? path5.basename(path5.dirname(file)) : base);
  }
  return [...names];
}
function scanComponents(root, appDir, pagesDir) {
  var _a;
  const files = [];
  const walk = (dir) => {
    let entries = [];
    try {
      entries = fs4.readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const e of entries) {
      if (files.length >= MAX_FILES) return;
      if (e.name.startsWith(".") && e.name !== ".storybook") continue;
      const full = path5.join(dir, e.name);
      if (e.isDirectory()) {
        if (!SKIP_DIRS.has(e.name)) walk(full);
      } else if (EXT_RE.test(e.name) && !/\.(test|spec|stories|d)\./.test(e.name) && !/^next\.config\./.test(e.name)) {
        files.push(full);
      }
    }
  };
  walk(root);
  const known = new Set(files);
  const ts = readTsPaths(root);
  const sources = /* @__PURE__ */ new Map();
  for (const f of files) {
    try {
      if (fs4.statSync(f).size <= MAX_SIZE) sources.set(f, fs4.readFileSync(f, "utf8"));
    } catch {
    }
  }
  const usedBy = /* @__PURE__ */ new Map();
  const importRe = /(?:import|export)\s[^'"]*?from\s*["']([^"']+)["']|import\(\s*["']([^"']+)["']\s*\)/g;
  for (const [file, code] of sources) {
    for (const m of code.matchAll(importRe)) {
      const spec = m[1] || m[2];
      if (!spec || !spec.startsWith(".") && !Object.keys(ts.paths).length) continue;
      const target = resolveImport(spec, file, ts, known);
      if (target && target !== file) {
        if (!usedBy.has(target)) usedBy.set(target, /* @__PURE__ */ new Set());
        usedBy.get(target).add(toPosix3(path5.relative(root, file)));
      }
    }
  }
  const out = [];
  for (const [file, code] of sources) {
    if (!/<[A-Za-z][\w.]*[\s/>]/.test(code) || !/return|=>/.test(code)) continue;
    const names = exportedComponents(code, file);
    if (!names.length) continue;
    const head = code.slice(0, 400).replace(/^\s*(\/\/.*\n|\/\*[\s\S]*?\*\/\s*)*/, "");
    const directive = (_a = head.match(/^["']use (client|server)["']/)) == null ? void 0 : _a[1];
    const inApp = !!appDir && file.startsWith(appDir + path5.sep);
    const inPages = !!pagesDir && file.startsWith(pagesDir + path5.sep);
    const base = path5.basename(file).replace(EXT_RE, "");
    const role = inApp && APP_SPECIAL.test(base) ? base : inPages ? base.startsWith("_") ? "pages-special" : "page" : "component";
    out.push({
      file: toPosix3(path5.relative(root, file)),
      names,
      directive: directive === "client" ? "client" : directive === "server" ? "server" : void 0,
      // In the App Router, files without "use client" render on the server unless a client file imports them.
      runtime: directive === "client" || inPages ? "client" : inApp ? "server" : "shared",
      role,
      usedBy: [...usedBy.get(file) ?? []].sort(),
      lines: code.split("\n").length
    });
  }
  return out.sort((a, b) => a.file.localeCompare(b.file));
}

// src/config/packages.ts
import fs5 from "fs";
import https from "https";
import path6 from "path";
import { createRequire as createRequire3 } from "module";
var latestCache = /* @__PURE__ */ new Map();
var TTL = 30 * 60 * 1e3;
function readJson2(file) {
  try {
    return JSON.parse(fs5.readFileSync(file, "utf8"));
  } catch {
    return void 0;
  }
}
function installedVersion2(root, name) {
  var _a, _b;
  const direct = (_a = readJson2(path6.join(root, "node_modules", name, "package.json"))) == null ? void 0 : _a.version;
  if (direct) return direct;
  try {
    return (_b = readJson2(createRequire3(path6.join(root, "package.json")).resolve(`${name}/package.json`))) == null ? void 0 : _b.version;
  } catch {
    return void 0;
  }
}
var parse = (v) => (v ?? "").replace(/^[^\d]*/, "").split(/[.+-]/).slice(0, 3).map((n) => Number(n) || 0);
function updateType(installed, latest) {
  if (!installed || !latest) return void 0;
  const [a, b, c] = parse(installed);
  const [x, y, z] = parse(latest);
  if (x > a) return "major";
  if (x === a && y > b) return "minor";
  if (x === a && y === b && z > c) return "patch";
  return void 0;
}
function getJson(url) {
  if (typeof fetch === "function" && typeof AbortController === "function") {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 5e3);
    return fetch(url, { signal: ctrl.signal, headers: { accept: "application/json" } }).then((r) => r.ok ? r.json() : null).finally(() => clearTimeout(t));
  }
  return new Promise((resolve, reject) => {
    const req2 = https.get(url, { headers: { accept: "application/json" }, timeout: 5e3 }, (res) => {
      if (res.statusCode !== 200) {
        res.resume();
        return resolve(null);
      }
      let data = "";
      res.setEncoding("utf8");
      res.on("data", (c) => data += c);
      res.on("end", () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    });
    req2.on("timeout", () => req2.destroy(new Error("timeout")));
    req2.on("error", reject);
  });
}
async function fetchLatest(name) {
  const hit = latestCache.get(name);
  if (hit && Date.now() - hit.at < TTL) return hit.version;
  let version = null;
  try {
    const body = await getJson(`https://registry.npmjs.org/${name.replace("/", "%2F")}/latest`);
    version = (body == null ? void 0 : body.version) ?? null;
  } catch {
    version = null;
  }
  latestCache.set(name, { version, at: Date.now() });
  return version;
}
async function listPackages(root, withLatest) {
  const pkg = readJson2(path6.join(root, "package.json")) ?? {};
  const entries = [];
  for (const [kind, deps] of [["dependency", pkg.dependencies], ["devDependency", pkg.devDependencies]]) {
    for (const [name, range] of Object.entries(deps ?? {})) {
      const local = /^(file|link|workspace|github|git\+|https?):/.test(range) || range.includes("/");
      entries.push({ name, range, kind, installed: installedVersion2(root, name), source: local ? "external" : "npm" });
    }
  }
  if (withLatest) {
    const queue = entries.filter((e) => e.source === "npm");
    let i = 0;
    await Promise.all(
      Array.from({ length: 8 }, async () => {
        while (i < queue.length) {
          const e = queue[i++];
          e.latest = await fetchLatest(e.name) ?? void 0;
          e.update = updateType(e.installed, e.latest);
        }
      })
    );
  }
  return entries.sort((a, b) => a.kind === b.kind ? a.name.localeCompare(b.name) : a.kind === "dependency" ? -1 : 1);
}

// src/config/runtime-config.ts
import path7 from "path";
import { createRequire as createRequire4 } from "module";
var resolvedConfig = {};
var HIDDEN_ENV = /^NEXT_DEVTOOLS_/;
function rememberConfig(config) {
  resolvedConfig = config;
}
function serialize(value, depth = 0, seen = /* @__PURE__ */ new WeakSet()) {
  if (value === void 0) return "undefined";
  if (value === null || typeof value !== "object") {
    if (typeof value === "function") return `\u0192 ${value.name || "anonymous"}()`;
    if (typeof value === "bigint" || typeof value === "symbol") return String(value);
    return value;
  }
  if (value instanceof RegExp) return value.toString();
  if (seen.has(value)) return "[Circular]";
  seen.add(value);
  if (depth > 8) return Array.isArray(value) ? `Array(${value.length})` : "{\u2026}";
  if (Array.isArray(value)) return value.map((v) => serialize(v, depth + 1, seen));
  const out = {};
  for (const [k, v] of Object.entries(value)) out[k] = serialize(v, depth + 1, seen);
  return out;
}
function parseDotenv(src) {
  const out = {};
  for (const line of src.split(/\r?\n/)) {
    const m = line.match(/^\s*(?:export\s+)?([\w.-]+)\s*=\s*(.*)$/);
    if (m) out[m[1]] = m[2].replace(/^(['"])(.*)\1$/, "$2");
  }
  return out;
}
function getConfigSnapshot(root) {
  const config = serialize(resolvedConfig);
  if (config.env && typeof config.env === "object") {
    for (const k of Object.keys(config.env)) if (HIDDEN_ENV.test(k)) delete config.env[k];
  }
  const envFiles = [];
  try {
    const { loadEnvConfig } = createRequire4(path7.join(root, "package.json"))("@next/env");
    const { loadedEnvFiles } = loadEnvConfig(root, true, { info() {
    }, error() {
    } }, true);
    for (const f of loadedEnvFiles ?? []) {
      envFiles.push({
        file: f.path,
        // Only NEXT_PUBLIC_* values are shown — they're in the client bundle anyway.
        vars: Object.entries(f.env ?? parseDotenv(f.contents ?? "")).map(([key, value]) => ({
          key,
          value: key.startsWith("NEXT_PUBLIC_") ? value : void 0
        }))
      });
    }
  } catch {
  }
  return { config, envFiles };
}

// src/config/server.ts
var GLOBAL_KEY = /* @__PURE__ */ Symbol.for("next-devtools.server");
function getOrCreateToken(root) {
  const dirs = [
    path8.join(root, "node_modules", ".cache", "next-devtools"),
    path8.join(os2.tmpdir(), "next-devtools-" + crypto.createHash("sha1").update(root).digest("hex").slice(0, 12))
  ];
  for (const dir of dirs) {
    try {
      fs6.mkdirSync(dir, { recursive: true });
      const file = path8.join(dir, "token");
      try {
        const existing = fs6.readFileSync(file, "utf8").trim();
        if (existing) return existing;
      } catch {
      }
      const token = crypto.randomBytes(24).toString("hex");
      try {
        fs6.writeFileSync(file, token, { flag: "wx", mode: 384 });
        return token;
      } catch {
        const raced = fs6.readFileSync(file, "utf8").trim();
        if (raced) return raced;
      }
    } catch {
    }
  }
  return crypto.createHash("sha256").update(root + os2.hostname() + os2.userInfo().username).digest("hex");
}
function send(res, status, body) {
  res.statusCode = status;
  res.setHeader("content-type", "application/json; charset=utf-8");
  res.end(JSON.stringify(body));
}
function readBody(req2) {
  return new Promise((resolve) => {
    let data = "";
    req2.on("data", (c) => {
      data += c;
      if (data.length > 64 * 1024) req2.destroy();
    });
    req2.on("end", () => {
      try {
        resolve(data ? JSON.parse(data) : {});
      } catch {
        resolve({});
      }
    });
    req2.on("error", () => resolve({}));
  });
}
function resolveInsideRoot(root, file) {
  if (typeof file !== "string" || !file) return null;
  const abs = path8.resolve(root, file);
  const rel = path8.relative(root, abs);
  if (rel.startsWith("..") || path8.isAbsolute(rel)) return null;
  return abs;
}
function startDevtoolsServer(opts) {
  const g = globalThis;
  if (g[GLOBAL_KEY]) return;
  g[GLOBAL_KEY] = true;
  const server = http.createServer(async (req2, res) => {
    const origin = req2.headers.origin;
    if (origin) {
      res.setHeader("access-control-allow-origin", origin);
      res.setHeader("vary", "origin");
    }
    res.setHeader("access-control-allow-headers", `content-type, ${TOKEN_HEADER}`);
    res.setHeader("access-control-allow-methods", "GET, POST, OPTIONS");
    res.setHeader("access-control-allow-private-network", "true");
    if (req2.method === "OPTIONS") {
      res.statusCode = 204;
      return res.end();
    }
    const url = new URL(req2.url || "/", "http://localhost");
    if (url.pathname === "/ping") return send(res, 200, { ok: true, root: path8.basename(opts.root) });
    if (req2.headers[TOKEN_HEADER] !== opts.token) return send(res, 401, { error: "invalid token" });
    try {
      switch (url.pathname) {
        case "/info":
          return send(res, 200, getProjectInfo(opts.root, opts.pageExtensions));
        case "/routes":
          return send(res, 200, scanRoutes(opts.root, opts.pageExtensions));
        case "/assets":
          return send(res, 200, scanAssets(opts.root));
        case "/open-in-editor": {
          if (req2.method !== "POST") return send(res, 405, { error: "POST only" });
          const body = await readBody(req2);
          const abs = resolveInsideRoot(opts.root, body.file);
          if (!abs || !fs6.existsSync(abs)) return send(res, 404, { error: "file not found in project" });
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
      return send(res, 500, { error: String((err == null ? void 0 : err.message) || err) });
    }
  });
  server.on("error", (err) => {
    if (err.code === "EADDRINUSE") {
      return;
    }
    console.warn(`[next-devtools] API server error: ${err.message}`);
  });
  server.listen(opts.port, "127.0.0.1", () => {
    console.log(`  \x1B[36m\u25C6\x1B[0m Next DevTools  \u2192 press \x1B[1mShift + Alt + D\x1B[0m in the browser (API on :${opts.port})`);
  });
  server.unref();
}

// src/config/index.ts
var PHASE_DEVELOPMENT_SERVER = "phase-development-server";
var DEFAULT_PORT = 4590;
var here = typeof __dirname !== "undefined" ? __dirname : path9.dirname(fileURLToPath2(import.meta.url));
var LOADER_PATH = path9.join(here, "loader.cjs");
function majorMinorOf(root, pkg, fallback) {
  try {
    const v = createRequire5(path9.join(root, "package.json"))(`${pkg}/package.json`).version;
    const [maj, min] = v.split(".").map(Number);
    return [maj || 0, min || 0];
  } catch {
    return fallback;
  }
}
var ROOT_MODERN = /[\\/]dist[\\/]client[\\/]root\.js$/;
var ROOT_LEGACY = path9.join(here, "client", "root-legacy.js");
var LegacyReactRootPlugin = class {
  apply(compiler) {
    compiler.hooks.normalModuleFactory.tap("NextDevtoolsLegacyRoot", (nmf) => {
      nmf.hooks.afterResolve.tap("NextDevtoolsLegacyRoot", (data) => {
        const target = (data == null ? void 0 : data.createData) ?? data;
        if ((target == null ? void 0 : target.resource) && ROOT_MODERN.test(target.resource)) {
          target.resource = ROOT_LEGACY;
          if (target.userRequest) target.userRequest = ROOT_LEGACY;
        }
        return data && !data.createData ? data : void 0;
      });
    });
  }
};
function addWebpackRule(config, root, inspector, legacyReact) {
  const userWebpack = config.webpack;
  config.webpack = (webpackConfig, ctx) => {
    const result = typeof userWebpack === "function" ? userWebpack(webpackConfig, ctx) : webpackConfig;
    if (ctx == null ? void 0 : ctx.dev) {
      if (inspector) {
        result.module = result.module || {};
        result.module.rules = result.module.rules || [];
        result.module.rules.unshift({
          test: /\.(jsx|tsx|js|mjs)$/,
          exclude: /[\\/]node_modules[\\/]/,
          enforce: "pre",
          use: [{ loader: LOADER_PATH, options: { root } }]
        });
      }
      if (legacyReact) {
        result.plugins = result.plugins || [];
        result.plugins.push(new LegacyReactRootPlugin());
      }
    }
    return result;
  };
}
function addTurbopackRules(config, root, [major, minor]) {
  const loader = { loader: LOADER_PATH, options: { root } };
  if (major >= 16) {
    config.turbopack = config.turbopack || {};
    const rules2 = config.turbopack.rules = config.turbopack.rules || {};
    for (const glob of ["*.tsx", "*.jsx", "*.js"]) {
      const item = { loaders: [loader], condition: { not: "foreign" } };
      const existing = rules2[glob];
      if (!existing) rules2[glob] = [item];
      else rules2[glob] = [item, ...Array.isArray(existing) ? existing : [existing]];
    }
    return;
  }
  if (major < 14) return;
  const stable = major > 15 || major === 15 && minor >= 3;
  const target = stable ? config.turbopack = config.turbopack || {} : (config.experimental = config.experimental || {}, config.experimental.turbo = config.experimental.turbo || {});
  const rules = target.rules = target.rules || {};
  const globs = major === 14 ? ["*.jsx"] : ["*.tsx", "*.jsx"];
  for (const glob of globs) {
    if (rules[glob]) {
      console.warn(`[next-devtools] a Turbopack rule for "${glob}" already exists; inspector source mapping is disabled for those files.`);
      continue;
    }
    rules[glob] = { loaders: [loader] };
  }
}
function withNextDevtools(nextConfig = {}, options = {}) {
  const apply = (phase, resolved) => {
    if (phase !== PHASE_DEVELOPMENT_SERVER || options.enabled === false || process.env.NEXT_DEVTOOLS === "0") {
      return resolved;
    }
    rememberConfig(resolved);
    const config = { ...resolved };
    const root = path9.resolve(options.root ?? process.cwd());
    const port = Number(options.port ?? process.env.NEXT_DEVTOOLS_PORT ?? DEFAULT_PORT);
    const token = getOrCreateToken(root);
    const pageExtensions = config.pageExtensions ?? ["tsx", "ts", "jsx", "js"];
    const [reactMajor] = majorMinorOf(root, "react", [19, 0]);
    config.env = {
      ...config.env || {},
      NEXT_DEVTOOLS_PORT: String(port),
      NEXT_DEVTOOLS_TOKEN: token,
      NEXT_DEVTOOLS_ROOT: root
    };
    addWebpackRule(config, root, options.inspector !== false, reactMajor < 18);
    if (options.inspector !== false) addTurbopackRules(config, root, majorMinorOf(root, "next", [16, 0]));
    startDevtoolsServer({ root, port, token, editor: options.editor, pageExtensions });
    return config;
  };
  return (phase, ctx) => {
    const resolved = typeof nextConfig === "function" ? nextConfig(phase, ctx) : { ...nextConfig };
    if (resolved && typeof resolved.then === "function") {
      return resolved.then((c) => apply(phase, c));
    }
    return apply(phase, resolved);
  };
}
var config_default = withNextDevtools;
export {
  config_default as default,
  withNextDevtools
};
