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
var import_node_path4 = __toESM(require("path"), 1);
var import_node_module2 = require("module");
var import_node_url = require("url");

// src/config/server.ts
var import_node_http = __toESM(require("http"), 1);
var import_node_fs3 = __toESM(require("fs"), 1);
var import_node_os = __toESM(require("os"), 1);
var import_node_path3 = __toESM(require("path"), 1);
var import_node_crypto = __toESM(require("crypto"), 1);
var import_launch_editor = __toESM(require("launch-editor"), 1);

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
    const entries = readDir(dir);
    const here2 = [...layouts];
    const layout = entries.find((e) => e.isFile() && extRe.exec(e.name)?.[1] === "layout");
    if (layout) here2.push(toPosix(import_node_path.default.relative(root, import_node_path.default.join(dir, layout.name))));
    for (const e of entries) {
      if (!e.isFile()) continue;
      const kind = extRe.exec(e.name)?.[1];
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
  try {
    const req = (0, import_node_module.createRequire)(import_node_path2.default.join(root, "package.json"));
    return readJson(req.resolve(`${pkg}/package.json`))?.version;
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

// src/config/server.ts
var GLOBAL_KEY = /* @__PURE__ */ Symbol.for("next-devtools.server");
function getOrCreateToken(root) {
  const dirs = [
    import_node_path3.default.join(root, "node_modules", ".cache", "next-devtools"),
    import_node_path3.default.join(import_node_os.default.tmpdir(), "next-devtools-" + import_node_crypto.default.createHash("sha1").update(root).digest("hex").slice(0, 12))
  ];
  for (const dir of dirs) {
    try {
      import_node_fs3.default.mkdirSync(dir, { recursive: true });
      const file = import_node_path3.default.join(dir, "token");
      try {
        const existing = import_node_fs3.default.readFileSync(file, "utf8").trim();
        if (existing) return existing;
      } catch {
      }
      const token = import_node_crypto.default.randomBytes(24).toString("hex");
      try {
        import_node_fs3.default.writeFileSync(file, token, { flag: "wx", mode: 384 });
        return token;
      } catch {
        const raced = import_node_fs3.default.readFileSync(file, "utf8").trim();
        if (raced) return raced;
      }
    } catch {
    }
  }
  return import_node_crypto.default.createHash("sha256").update(root + import_node_os.default.hostname() + import_node_os.default.userInfo().username).digest("hex");
}
function send(res, status, body) {
  res.statusCode = status;
  res.setHeader("content-type", "application/json; charset=utf-8");
  res.end(JSON.stringify(body));
}
function readBody(req) {
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
function resolveInsideRoot(root, file) {
  if (typeof file !== "string" || !file) return null;
  const abs = import_node_path3.default.resolve(root, file);
  const rel = import_node_path3.default.relative(root, abs);
  if (rel.startsWith("..") || import_node_path3.default.isAbsolute(rel)) return null;
  return abs;
}
function startDevtoolsServer(opts) {
  const g = globalThis;
  if (g[GLOBAL_KEY]) return;
  g[GLOBAL_KEY] = true;
  const server = import_node_http.default.createServer(async (req, res) => {
    const origin = req.headers.origin;
    if (origin) {
      res.setHeader("access-control-allow-origin", origin);
      res.setHeader("vary", "origin");
    }
    res.setHeader("access-control-allow-headers", `content-type, ${TOKEN_HEADER}`);
    res.setHeader("access-control-allow-methods", "GET, POST, OPTIONS");
    res.setHeader("access-control-allow-private-network", "true");
    if (req.method === "OPTIONS") {
      res.statusCode = 204;
      return res.end();
    }
    const url = new URL(req.url || "/", "http://localhost");
    if (url.pathname === "/ping") return send(res, 200, { ok: true, root: import_node_path3.default.basename(opts.root) });
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
          if (!abs || !import_node_fs3.default.existsSync(abs)) return send(res, 404, { error: "file not found in project" });
          const line = Math.max(1, Number(body.line) || 1);
          const column = Math.max(1, Number(body.column) || 1);
          (0, import_launch_editor.default)(`${abs}:${line}:${column}`, opts.editor, (_f, msg) => {
            console.warn(`[next-devtools] could not open editor: ${msg ?? "unknown error"} \u2014 set LAUNCH_EDITOR or the \`editor\` option`);
          });
          return send(res, 200, { ok: true, file: abs });
        }
        default:
          return send(res, 404, { error: "not found" });
      }
    } catch (err) {
      return send(res, 500, { error: String(err?.message || err) });
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
var here = typeof __dirname !== "undefined" ? __dirname : import_node_path4.default.dirname((0, import_node_url.fileURLToPath)(importMetaUrl));
var LOADER_PATH = import_node_path4.default.join(here, "loader.cjs");
function nextMajorMinor(root) {
  try {
    const v = (0, import_node_module2.createRequire)(import_node_path4.default.join(root, "package.json"))("next/package.json").version;
    const [maj, min] = v.split(".").map(Number);
    return [maj || 0, min || 0];
  } catch {
    return [16, 0];
  }
}
function addWebpackRule(config, root) {
  const userWebpack = config.webpack;
  config.webpack = (webpackConfig, ctx) => {
    const result = typeof userWebpack === "function" ? userWebpack(webpackConfig, ctx) : webpackConfig;
    if (ctx?.dev) {
      result.module = result.module || {};
      result.module.rules = result.module.rules || [];
      result.module.rules.unshift({
        test: /\.(jsx|tsx|js|mjs)$/,
        exclude: /[\\/]node_modules[\\/]/,
        enforce: "pre",
        use: [{ loader: LOADER_PATH, options: { root } }]
      });
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
  const target = major > 15 || major === 15 && minor >= 3 ? config.turbopack = config.turbopack || {} : (config.experimental = config.experimental || {}, config.experimental.turbo = config.experimental.turbo || {});
  const rules = target.rules = target.rules || {};
  for (const glob of ["*.tsx", "*.jsx"]) {
    if (rules[glob]) {
      console.warn(`[next-devtools] a Turbopack rule for "${glob}" already exists; inspector source mapping is disabled for those files.`);
      continue;
    }
    rules[glob] = { loaders: [loader] };
  }
}
function withNextDevtools(nextConfig = {}, options = {}) {
  return async (phase, ctx) => {
    const resolved = typeof nextConfig === "function" ? await nextConfig(phase, ctx) : { ...nextConfig };
    if (phase !== PHASE_DEVELOPMENT_SERVER || options.enabled === false || process.env.NEXT_DEVTOOLS === "0") {
      return resolved;
    }
    const config = { ...resolved };
    const root = import_node_path4.default.resolve(options.root ?? process.cwd());
    const port = Number(options.port ?? process.env.NEXT_DEVTOOLS_PORT ?? DEFAULT_PORT);
    const token = getOrCreateToken(root);
    const pageExtensions = config.pageExtensions ?? ["tsx", "ts", "jsx", "js"];
    config.env = {
      ...config.env || {},
      NEXT_DEVTOOLS_PORT: String(port),
      NEXT_DEVTOOLS_TOKEN: token,
      NEXT_DEVTOOLS_ROOT: root
    };
    if (options.inspector !== false) {
      addWebpackRule(config, root);
      addTurbopackRules(config, root, nextMajorMinor(root));
    }
    startDevtoolsServer({ root, port, token, editor: options.editor, pageExtensions });
    return config;
  };
}
var config_default = withNextDevtools;
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  withNextDevtools
});
