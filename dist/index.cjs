"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var src_exports = {};
__export(src_exports, {
  default: () => config_default,
  withNextDevtools: () => withNextDevtools
});
module.exports = __toCommonJS(src_exports);

// node_modules/tsup/assets/cjs_shims.js
var getImportMetaUrl = () => typeof document === "undefined" ? new URL(`file:${__filename}`).href : document.currentScript && document.currentScript.tagName.toUpperCase() === "SCRIPT" ? document.currentScript.src : new URL("main.js", document.baseURI).href;
var importMetaUrl = /* @__PURE__ */ getImportMetaUrl();

// src/config/index.ts
var import_node_path9 = __toESM(require("path"), 1);
var import_node_module5 = require("module");
var import_node_url = require("url");

// src/config/server.ts
var import_node_http = __toESM(require("http"), 1);
var import_node_fs7 = __toESM(require("fs"), 1);
var import_node_os2 = __toESM(require("os"), 1);
var import_node_path8 = __toESM(require("path"), 1);
var import_node_crypto = __toESM(require("crypto"), 1);

// src/shared/types.ts
var TOKEN_HEADER = "x-next-devtools-token";

// src/config/project.ts
var import_node_fs2 = __toESM(require("fs"), 1);
var import_node_path2 = __toESM(require("path"), 1);
var import_node_module = require("module");

// src/config/routes.ts
var import_node_fs = __toESM(require("fs"), 1);
var import_node_path = __toESM(require("path"), 1);
var toPosix = (p) => p.split(import_node_path.default.sep).join("/");
function readDir(dir) {
  try {
    return import_node_fs.default.readdirSync(dir, { withFileTypes: true });
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
    for (const candidate of [import_node_path.default.join(root, name), import_node_path.default.join(root, "src", name)]) {
      try {
        if (import_node_fs.default.statSync(candidate).isDirectory()) return candidate;
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
    if (layout) here2.push(toPosix(import_node_path.default.relative(root, import_node_path.default.join(dir, layout.name))));
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
        file: toPosix(import_node_path.default.relative(root, import_node_path.default.join(dir, e.name))),
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
      walk(import_node_path.default.join(dir, e.name), [...segments, e.name], here2);
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
      const full = import_node_path.default.join(dir, e.name);
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
        file: toPosix(import_node_path.default.relative(root, full)),
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
var toPosix2 = (p) => p.split(import_node_path2.default.sep).join("/");
function readJson(file) {
  try {
    return JSON.parse(import_node_fs2.default.readFileSync(file, "utf8"));
  } catch {
    return void 0;
  }
}
function installedVersion(root, pkg) {
  var _a;
  try {
    const req2 = (0, import_node_module.createRequire)(import_node_path2.default.join(root, "package.json"));
    return (_a = readJson(req2.resolve(`${pkg}/package.json`))) == null ? void 0 : _a.version;
  } catch {
    return void 0;
  }
}
function firstExisting(root, names) {
  for (const n of names) {
    if (import_node_fs2.default.existsSync(import_node_path2.default.join(root, n))) return n;
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
  const pkg = readJson(import_node_path2.default.join(root, "package.json")) ?? {};
  const { appDir, pagesDir } = resolveRouterDirs(root);
  const next = installedVersion(root, "next");
  const exts = ["ts", "js", "mjs", "tsx", "jsx"];
  const withSrc = (base) => exts.flatMap((e) => [`${base}.${e}`, `src/${base}.${e}`]);
  const publicEnv = {};
  let env = process.env;
  try {
    const { loadEnvConfig } = (0, import_node_module.createRequire)(import_node_path2.default.join(root, "package.json"))("@next/env");
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
      appDir: appDir && toPosix2(import_node_path2.default.relative(root, appDir)),
      pagesDir: pagesDir && toPosix2(import_node_path2.default.relative(root, pagesDir))
    },
    middleware: firstExisting(root, [...withSrc("proxy"), ...withSrc("middleware")]),
    instrumentation: firstExisting(root, withSrc("instrumentation")),
    srcDir: import_node_fs2.default.existsSync(import_node_path2.default.join(root, "src")),
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
  const publicDir = import_node_path2.default.join(root, "public");
  const out = [];
  const walk = (dir) => {
    let entries = [];
    try {
      entries = import_node_fs2.default.readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const e of entries) {
      if (out.length >= limit) return;
      if (e.name.startsWith(".")) continue;
      const full = import_node_path2.default.join(dir, e.name);
      if (e.isDirectory()) walk(full);
      else if (e.isFile()) {
        let st;
        try {
          st = import_node_fs2.default.statSync(full);
        } catch {
          continue;
        }
        const ext = import_node_path2.default.extname(e.name).slice(1).toLowerCase();
        out.push({
          path: "/" + toPosix2(import_node_path2.default.relative(publicDir, full)),
          file: toPosix2(import_node_path2.default.relative(root, full)),
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
var import_node_fs3 = __toESM(require("fs"), 1);
var import_node_os = __toESM(require("os"), 1);
var import_node_path3 = __toESM(require("path"), 1);
var import_node_module2 = require("module");
var import_launch_editor = __toESM(require("launch-editor"), 1);
var req = (0, import_node_module2.createRequire)(typeof __filename !== "undefined" ? __filename : importMetaUrl);
var PATH_EDITORS = ["code", "cursor", "windsurf", "code-insiders", "zed", "webstorm", "idea", "subl"];
var TERMINAL_EDITORS = /^(vi|vim|nvim|nano|emacs|ed|micro|hx|helix|joe|less|more)$/;
function wslDistro() {
  if (process.platform !== "linux") return void 0;
  if (process.env.WSL_DISTRO_NAME) return process.env.WSL_DISTRO_NAME;
  return /microsoft/i.test(import_node_os.default.release()) ? "WSL" : void 0;
}
function windowsPathOf(abs) {
  const m = abs.match(/^\/mnt\/([a-z])\/(.*)$/i);
  return m ? `${m[1].toUpperCase()}:/${m[2]}` : void 0;
}
function onPath(cmd) {
  const exts = process.platform === "win32" ? ["", ".cmd", ".exe", ".bat"] : [""];
  for (const dir of (process.env.PATH || "").split(import_node_path3.default.delimiter)) {
    if (!dir) continue;
    for (const ext of exts) {
      try {
        if (import_node_fs3.default.statSync(import_node_path3.default.join(dir, cmd + ext)).isFile()) return true;
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
    if (found && !TERMINAL_EDITORS.test(import_node_path3.default.basename(found))) return found;
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
    (0, import_launch_editor.default)(`${abs}:${line}:${column}`, editor, (_file, msg) => {
      const reason = msg || `Could not run "${editor}".`;
      console.warn(`[next-devtools] ${reason}`);
      done({ ok: false, editor, reason, ...hints });
    });
    setTimeout(() => done({ ok: true, editor, ...hints }), 400);
  });
}

// src/config/components.ts
var import_node_fs4 = __toESM(require("fs"), 1);
var import_node_path4 = __toESM(require("path"), 1);
var toPosix3 = (p) => p.split(import_node_path4.default.sep).join("/");
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
      const raw = stripJsonc(import_node_fs4.default.readFileSync(import_node_path4.default.join(root, name), "utf8"));
      const co = JSON.parse(raw).compilerOptions ?? {};
      return { baseUrl: import_node_path4.default.resolve(root, co.baseUrl ?? "."), paths: co.paths ?? {} };
    } catch {
    }
  }
  return { baseUrl: root, paths: {} };
}
function resolveImport(spec, fromFile, ts, known) {
  let bases = [];
  if (spec.startsWith(".")) bases = [import_node_path4.default.resolve(import_node_path4.default.dirname(fromFile), spec)];
  else {
    for (const [pattern, targets] of Object.entries(ts.paths)) {
      const prefix = pattern.replace(/\*$/, "");
      if (pattern.endsWith("*") ? spec.startsWith(prefix) : spec === pattern) {
        const rest = pattern.endsWith("*") ? spec.slice(prefix.length) : "";
        bases.push(...targets.map((t) => import_node_path4.default.resolve(ts.baseUrl, t.replace(/\*$/, rest))));
      }
    }
  }
  for (const base of bases) {
    for (const cand of [base, ...["tsx", "ts", "jsx", "js", "mjs"].flatMap((e) => [`${base}.${e}`, import_node_path4.default.join(base, `index.${e}`)])]) {
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
    const base = import_node_path4.default.basename(file).replace(EXT_RE, "");
    names.add(base === "index" ? import_node_path4.default.basename(import_node_path4.default.dirname(file)) : base);
  }
  return [...names];
}
function scanComponents(root, appDir, pagesDir) {
  var _a;
  const files = [];
  const walk = (dir) => {
    let entries = [];
    try {
      entries = import_node_fs4.default.readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const e of entries) {
      if (files.length >= MAX_FILES) return;
      if (e.name.startsWith(".") && e.name !== ".storybook") continue;
      const full = import_node_path4.default.join(dir, e.name);
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
      if (import_node_fs4.default.statSync(f).size <= MAX_SIZE) sources.set(f, import_node_fs4.default.readFileSync(f, "utf8"));
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
        usedBy.get(target).add(toPosix3(import_node_path4.default.relative(root, file)));
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
    const inApp = !!appDir && file.startsWith(appDir + import_node_path4.default.sep);
    const inPages = !!pagesDir && file.startsWith(pagesDir + import_node_path4.default.sep);
    const base = import_node_path4.default.basename(file).replace(EXT_RE, "");
    const role = inApp && APP_SPECIAL.test(base) ? base : inPages ? base.startsWith("_") ? "pages-special" : "page" : "component";
    out.push({
      file: toPosix3(import_node_path4.default.relative(root, file)),
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
var import_node_fs5 = __toESM(require("fs"), 1);
var import_node_https = __toESM(require("https"), 1);
var import_node_path5 = __toESM(require("path"), 1);
var import_node_module3 = require("module");
var latestCache = /* @__PURE__ */ new Map();
var TTL = 30 * 60 * 1e3;
function readJson2(file) {
  try {
    return JSON.parse(import_node_fs5.default.readFileSync(file, "utf8"));
  } catch {
    return void 0;
  }
}
function installedVersion2(root, name) {
  var _a, _b;
  const direct = (_a = readJson2(import_node_path5.default.join(root, "node_modules", name, "package.json"))) == null ? void 0 : _a.version;
  if (direct) return direct;
  try {
    return (_b = readJson2((0, import_node_module3.createRequire)(import_node_path5.default.join(root, "package.json")).resolve(`${name}/package.json`))) == null ? void 0 : _b.version;
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
    const req2 = import_node_https.default.get(url, { headers: { accept: "application/json" }, timeout: 5e3 }, (res) => {
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
  const pkg = readJson2(import_node_path5.default.join(root, "package.json")) ?? {};
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
var import_node_path6 = __toESM(require("path"), 1);
var import_node_module4 = require("module");
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
    const { loadEnvConfig } = (0, import_node_module4.createRequire)(import_node_path6.default.join(root, "package.json"))("@next/env");
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

// src/config/git.ts
var import_node_child_process = require("child_process");
var import_node_https2 = __toESM(require("https"), 1);
var import_node_path7 = __toESM(require("path"), 1);

// src/config/component-range.ts
var import_node_fs6 = __toESM(require("fs"), 1);
var import_parser = require("@babel/parser");
function pluginsFor(file) {
  return /\.tsx?$/.test(file) ? ["jsx", "typescript", "decorators-legacy"] : ["jsx", "flow", "decorators-legacy"];
}
var isComponentName = (n) => !!n && /^[A-Z]/.test(n);
function unwrapCall(node) {
  var _a;
  let n = node;
  for (let i = 0; i < 4 && (n == null ? void 0 : n.type) === "CallExpression"; i++) {
    const fn = (_a = n.arguments) == null ? void 0 : _a.find((a) => /Function|ArrowFunction|CallExpression/.test(a == null ? void 0 : a.type));
    if (!fn) return null;
    n = fn;
  }
  return n && /FunctionExpression|ArrowFunctionExpression/.test(n.type) ? n : null;
}
function findComponentCandidates(code, file) {
  let ast;
  try {
    ast = (0, import_parser.parse)(code, { sourceType: "unambiguous", plugins: pluginsFor(file), errorRecovery: true });
  } catch {
    return [];
  }
  const out = [];
  const add = (name, node, depth, isDefault = false) => {
    if (!(node == null ? void 0 : node.loc)) return;
    out.push({ name, start: node.loc.start.line, end: node.loc.end.line, depth, isDefault });
  };
  const visit = (node, depth, parentDefault = false) => {
    var _a, _b, _c;
    if (!node || typeof node.type !== "string") return;
    switch (node.type) {
      case "ExportDefaultDeclaration": {
        const d = node.declaration;
        if ((d == null ? void 0 : d.type) === "FunctionDeclaration" || (d == null ? void 0 : d.type) === "ClassDeclaration") add((_a = d.id) == null ? void 0 : _a.name, node, depth, true);
        else if (/FunctionExpression|ArrowFunctionExpression/.test(d == null ? void 0 : d.type) || unwrapCall(d)) add(void 0, node, depth, true);
        break;
      }
      case "FunctionDeclaration":
      case "ClassDeclaration":
        if (!parentDefault) add((_b = node.id) == null ? void 0 : _b.name, node, depth);
        break;
      case "VariableDeclarator": {
        const init = node.init;
        if (init && (/FunctionExpression|ArrowFunctionExpression|ClassExpression/.test(init.type) || unwrapCall(init))) {
          add((_c = node.id) == null ? void 0 : _c.name, node, depth);
        }
        break;
      }
    }
    for (const key in node) {
      if (key === "loc" || key === "leadingComments" || key === "trailingComments" || key === "extra") continue;
      const child = node[key];
      const isDefault = node.type === "ExportDefaultDeclaration";
      if (Array.isArray(child)) child.forEach((c) => c && typeof c === "object" && visit(c, depth + 1, isDefault));
      else if (child && typeof child === "object" && typeof child.type === "string") visit(child, depth + 1, isDefault);
    }
  };
  visit(ast.program, 0);
  return out;
}
function pickComponentRange(candidates, line, name) {
  const contains = (c) => line != null && c.start <= line && line <= c.end;
  const byName = name ? candidates.filter((c) => c.name === name) : [];
  if (byName.length) {
    const hit = byName.find(contains) ?? byName[0];
    return { name: hit.name, start: hit.start, end: hit.end };
  }
  if (line != null) {
    const around = candidates.filter(contains);
    const pick = [...around].sort((a, b) => b.depth - a.depth).find((c) => isComponentName(c.name) || c.isDefault) ?? around.sort((a, b) => b.depth - a.depth)[0];
    if (pick) return { name: pick.name ?? name, start: pick.start, end: pick.end };
  }
  const def = candidates.find((c) => c.isDefault);
  return def ? { name: def.name ?? name, start: def.start, end: def.end } : void 0;
}
function componentRange(abs, line, name) {
  let code;
  try {
    code = import_node_fs6.default.readFileSync(abs, "utf8");
  } catch {
    return void 0;
  }
  return pickComponentRange(findComponentCandidates(code, abs), line, name);
}

// src/config/git.ts
var SEP = "";
var CACHE_TTL = 15e3;
var cache = /* @__PURE__ */ new Map();
var loginCache = /* @__PURE__ */ new Map();
var RETRY_FAILED_LOOKUP = 10 * 6e4;
function git(cwd, args) {
  return new Promise((resolve, reject) => {
    (0, import_node_child_process.execFile)("git", args, { cwd, timeout: 5e3, maxBuffer: 1024 * 1024, windowsHide: true }, (err, stdout) => {
      if (err) reject(err);
      else resolve(String(stdout));
    });
  });
}
function parseRemote(url) {
  const u = url.trim();
  if (!u) return void 0;
  let host;
  let repoPath;
  let m;
  if (m = u.match(/^[\w.-]+@([^:/]+):(.+)$/)) {
    host = m[1];
    repoPath = m[2];
  } else {
    try {
      const parsed = new URL(u);
      host = parsed.hostname;
      repoPath = parsed.pathname;
    } catch {
      return void 0;
    }
  }
  repoPath = repoPath.replace(/^\/+/, "").replace(/\.git$/, "").replace(/\/+$/, "");
  if (!host || !repoPath.includes("/")) return void 0;
  host = host.replace(/^ssh\./, "").replace(/^www\./, "");
  const provider = /github/.test(host) ? "github" : /gitlab/.test(host) ? "gitlab" : /bitbucket/.test(host) ? "bitbucket" : "other";
  return { provider, host, path: repoPath, web: `https://${host}/${repoPath}` };
}
function githubLoginFromEmail(email) {
  var _a;
  return (_a = email.match(/^(?:\d+\+)?([A-Za-z0-9-]+)@users\.noreply\.github\.com$/i)) == null ? void 0 : _a[1];
}
function commitUrl(remote, sha) {
  if (!remote || /^0+$/.test(sha)) return void 0;
  if (remote.provider === "gitlab") return `${remote.web}/-/commit/${sha}`;
  if (remote.provider === "bitbucket") return `${remote.web}/commits/${sha}`;
  return `${remote.web}/commit/${sha}`;
}
function authorUrl(remote, commit, branch) {
  const login = commit.login ?? ((remote == null ? void 0 : remote.provider) === "github" ? githubLoginFromEmail(commit.authorEmail) : void 0);
  if (login && (remote == null ? void 0 : remote.provider) === "github") return `https://${remote.host}/${login}`;
  if (!remote) return void 0;
  if (remote.provider === "github") return `${remote.web}/commits?author=${encodeURIComponent(commit.authorEmail)}`;
  if (remote.provider === "gitlab") return `${remote.web}/-/commits/${encodeURIComponent(branch || "HEAD")}?author=${encodeURIComponent(commit.authorName)}`;
  return void 0;
}
function parseBlame(out) {
  var _a;
  const lines = out.split("\n");
  const sha = (_a = lines[0]) == null ? void 0 : _a.split(" ")[0];
  if (!sha || !/^[0-9a-f]{7,40}$/.test(sha)) return void 0;
  const get = (k) => {
    var _a2;
    return ((_a2 = lines.find((l) => l.startsWith(k + " "))) == null ? void 0 : _a2.slice(k.length + 1)) ?? "";
  };
  const time = Number(get("author-time"));
  return {
    sha,
    authorName: get("author"),
    authorEmail: get("author-mail").replace(/^<|>$/g, ""),
    date: time ? new Date(time * 1e3).toISOString() : "",
    subject: get("summary")
  };
}
function parseBlameRange(out) {
  const bySha = /* @__PURE__ */ new Map();
  let current;
  for (const line of out.split("\n")) {
    const head = line.match(/^([0-9a-f]{40}) \d+ \d+/);
    if (head) {
      current = bySha.get(head[1]);
      if (!current) {
        current = { sha: head[1], authorName: "", authorEmail: "", time: 0, subject: "", lines: 0 };
        bySha.set(head[1], current);
      }
      current.lines++;
      continue;
    }
    if (!current || line.startsWith("	")) continue;
    const sp = line.indexOf(" ");
    const key = sp === -1 ? line : line.slice(0, sp);
    const val = sp === -1 ? "" : line.slice(sp + 1);
    if (key === "author") current.authorName = val;
    else if (key === "author-mail") current.authorEmail = val.replace(/^<|>$/g, "");
    else if (key === "author-time") current.time = Number(val) || 0;
    else if (key === "summary") current.subject = val;
  }
  return [...bySha.values()];
}
function githubAuthor(remote, sha) {
  if (remote.provider !== "github" || remote.host !== "github.com") return Promise.resolve(null);
  const key = `${remote.path}@${sha}`;
  let hit = loginCache.get(key);
  if (!hit) {
    const headers = { "user-agent": "next-devtools", accept: "application/vnd.github+json" };
    const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
    if (token) headers.authorization = `Bearer ${token}`;
    const url = `https://api.github.com/repos/${remote.path}/commits/${sha}`;
    const pick = (j) => {
      var _a;
      return ((_a = j == null ? void 0 : j.author) == null ? void 0 : _a.login) ? { login: j.author.login, avatar: j.author.avatar_url } : null;
    };
    hit = typeof fetch === "function" && typeof AbortController === "function" ? (() => {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), 4e3);
      return fetch(url, { headers, signal: ctrl.signal }).then((r) => r.ok ? r.json() : null).then(pick, () => null).finally(() => clearTimeout(t));
    })() : new Promise((resolve) => {
      const req2 = import_node_https2.default.get(url, { headers, timeout: 4e3 }, (res) => {
        let body = "";
        res.setEncoding("utf8");
        res.on("data", (c) => body += c);
        res.on("end", () => {
          try {
            resolve(res.statusCode === 200 ? pick(JSON.parse(body)) : null);
          } catch {
            resolve(null);
          }
        });
      });
      req2.on("timeout", () => req2.destroy());
      req2.on("error", () => resolve(null));
    });
    loginCache.set(key, hit);
    hit.then((r) => {
      var _a, _b;
      if (!r) (_b = (_a = setTimeout(() => loginCache.delete(key), RETRY_FAILED_LOOKUP)).unref) == null ? void 0 : _b.call(_a);
    });
  }
  return hit;
}
async function enrich(c, remote, branch, lookup) {
  const uncommitted = /^0+$/.test(c.sha);
  let login = (remote == null ? void 0 : remote.provider) === "github" ? githubLoginFromEmail(c.authorEmail) : void 0;
  let avatar;
  if (!uncommitted && remote && lookup) {
    const gh = await githubAuthor(remote, c.sha);
    if (gh == null ? void 0 : gh.login) {
      login = gh.login;
      avatar = gh.avatar;
    }
  }
  if (login && !avatar && (remote == null ? void 0 : remote.host) === "github.com") avatar = `https://github.com/${login}.png?size=64`;
  const commit = { ...c, shortSha: c.sha.slice(0, 7), login, avatar, uncommitted };
  commit.url = commitUrl(remote, c.sha);
  commit.authorUrl = uncommitted ? void 0 : authorUrl(remote, commit, branch);
  return commit;
}
async function load(root, abs, line, name, lookup) {
  const dir = import_node_path7.default.dirname(abs);
  let top;
  try {
    top = (await git(dir, ["rev-parse", "--show-toplevel"])).trim();
  } catch (e) {
    const missing = e.code === "ENOENT";
    return { available: false, reason: missing ? "git isn't installed or not on PATH" : "Not inside a git repository" };
  }
  const range = componentRange(abs, line, name);
  const [remoteUrl, branch, status, log, blame, rangeBlame] = await Promise.all([
    git(top, ["remote", "get-url", "origin"]).catch(() => ""),
    git(top, ["rev-parse", "--abbrev-ref", "HEAD"]).then((s) => s.trim()).catch(() => void 0),
    git(top, ["status", "--porcelain", "--", abs]).catch(() => ""),
    git(top, ["log", "-1", `--format=%H${SEP}%an${SEP}%ae${SEP}%aI${SEP}%s`, "--", abs]).catch(() => ""),
    line ? git(top, ["blame", "-L", `${line},${line}`, "--porcelain", "--", abs]).catch(() => "") : Promise.resolve(""),
    range ? git(top, ["blame", "-L", `${range.start},${range.end}`, "--porcelain", "--", abs]).catch(() => "") : Promise.resolve("")
  ]);
  const remote = parseRemote(remoteUrl);
  const st = status.trim().slice(0, 2);
  const state = !st ? "clean" : st === "??" ? "untracked" : "modified";
  let file;
  const parts = log.trim().split(SEP);
  if (parts.length === 5 && parts[0]) {
    file = await enrich({ sha: parts[0], authorName: parts[1], authorEmail: parts[2], date: parts[3], subject: parts[4] }, remote, branch, lookup);
  }
  let lineCommit;
  const b = blame ? parseBlame(blame) : void 0;
  if (b) lineCommit = await enrich(b, remote, branch, lookup);
  let component;
  if (range) {
    const entries = parseBlameRange(rangeBlame);
    const committed = entries.filter((e) => !/^0+$/.test(e.sha));
    const newest = committed.sort((a, b2) => b2.time - a.time)[0];
    const authors = /* @__PURE__ */ new Map();
    for (const e of committed) {
      const a = authors.get(e.authorEmail) ?? { name: e.authorName, email: e.authorEmail, lines: 0 };
      a.lines += e.lines;
      authors.set(e.authorEmail, a);
    }
    component = {
      name: range.name,
      start: range.start,
      end: range.end,
      uncommittedLines: entries.filter((e) => /^0+$/.test(e.sha)).reduce((n, e) => n + e.lines, 0),
      authors: [...authors.values()].sort((a, b2) => b2.lines - a.lines),
      commit: newest ? await enrich(
        { sha: newest.sha, authorName: newest.authorName, authorEmail: newest.authorEmail, date: new Date(newest.time * 1e3).toISOString(), subject: newest.subject },
        remote,
        branch,
        lookup
      ) : void 0
    };
  }
  return {
    available: true,
    branch,
    remote,
    state,
    file,
    line: lineCommit,
    lineNumber: line,
    component,
    path: import_node_path7.default.relative(top, abs).split(import_node_path7.default.sep).join("/")
  };
}
function getGitInfo(root, abs, line, lookup = true, name) {
  const key = `${abs}:${line ?? ""}:${name ?? ""}:${lookup ? 1 : 0}`;
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < CACHE_TTL) return hit.value;
  const value = load(root, abs, line, name, lookup).catch((e) => ({ available: false, reason: String((e == null ? void 0 : e.message) || e) }));
  cache.set(key, { at: Date.now(), value });
  return value;
}

// src/config/server.ts
var GLOBAL_KEY = /* @__PURE__ */ Symbol.for("next-devtools.server");
function getOrCreateToken(root) {
  const dirs = [
    import_node_path8.default.join(root, "node_modules", ".cache", "next-devtools"),
    import_node_path8.default.join(import_node_os2.default.tmpdir(), "next-devtools-" + import_node_crypto.default.createHash("sha1").update(root).digest("hex").slice(0, 12))
  ];
  for (const dir of dirs) {
    try {
      import_node_fs7.default.mkdirSync(dir, { recursive: true });
      const file = import_node_path8.default.join(dir, "token");
      try {
        const existing = import_node_fs7.default.readFileSync(file, "utf8").trim();
        if (existing) return existing;
      } catch {
      }
      const token = import_node_crypto.default.randomBytes(24).toString("hex");
      try {
        import_node_fs7.default.writeFileSync(file, token, { flag: "wx", mode: 384 });
        return token;
      } catch {
        const raced = import_node_fs7.default.readFileSync(file, "utf8").trim();
        if (raced) return raced;
      }
    } catch {
    }
  }
  return import_node_crypto.default.createHash("sha256").update(root + import_node_os2.default.hostname() + import_node_os2.default.userInfo().username).digest("hex");
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
  const abs = import_node_path8.default.resolve(root, file);
  const rel = import_node_path8.default.relative(root, abs);
  if (rel.startsWith("..") || import_node_path8.default.isAbsolute(rel)) return null;
  return abs;
}
function startDevtoolsServer(opts) {
  const g = globalThis;
  if (g[GLOBAL_KEY]) return;
  g[GLOBAL_KEY] = true;
  const server = import_node_http.default.createServer(async (req2, res) => {
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
    if (url.pathname === "/ping") return send(res, 200, { ok: true, root: import_node_path8.default.basename(opts.root) });
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
          if (!abs || !import_node_fs7.default.existsSync(abs)) return send(res, 404, { error: "file not found in project" });
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
        case "/git": {
          const abs = resolveInsideRoot(opts.root, url.searchParams.get("file") || "");
          if (!abs || !import_node_fs7.default.existsSync(abs)) return send(res, 404, { error: "file not found in project" });
          const line = Number(url.searchParams.get("line")) || void 0;
          const name = url.searchParams.get("name") || void 0;
          return send(res, 200, await getGitInfo(opts.root, abs, line, url.searchParams.get("lookup") !== "0", name));
        }
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
var here = typeof __dirname !== "undefined" ? __dirname : import_node_path9.default.dirname((0, import_node_url.fileURLToPath)(importMetaUrl));
var LOADER_PATH = import_node_path9.default.join(here, "loader.cjs");
function majorMinorOf(root, pkg, fallback) {
  try {
    const v = (0, import_node_module5.createRequire)(import_node_path9.default.join(root, "package.json"))(`${pkg}/package.json`).version;
    const [maj, min] = v.split(".").map(Number);
    return [maj || 0, min || 0];
  } catch {
    return fallback;
  }
}
var ROOT_MODERN = /[\\/]dist[\\/]client[\\/]root\.js$/;
var ROOT_LEGACY = import_node_path9.default.join(here, "client", "root-legacy.js");
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
    const root = import_node_path9.default.resolve(options.root ?? process.cwd());
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
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  withNextDevtools
});
