// node_modules/tsup/assets/esm_shims.js
import path from "path";
import { fileURLToPath } from "url";
var getFilename = () => fileURLToPath(import.meta.url);
var getDirname = () => path.dirname(getFilename());
var __dirname = /* @__PURE__ */ getDirname();

// src/config/index.ts
import path5 from "path";
import { createRequire as createRequire2 } from "module";
import { fileURLToPath as fileURLToPath2 } from "url";

// src/config/server.ts
import http from "http";
import fs3 from "fs";
import os from "os";
import path4 from "path";
import crypto from "crypto";
import launchEditor from "launch-editor";

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
    const entries = readDir(dir);
    const here2 = [...layouts];
    const layout = entries.find((e) => e.isFile() && extRe.exec(e.name)?.[1] === "layout");
    if (layout) here2.push(toPosix(path2.relative(root, path2.join(dir, layout.name))));
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
  try {
    const req = createRequire(path3.join(root, "package.json"));
    return readJson(req.resolve(`${pkg}/package.json`))?.version;
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

// src/config/server.ts
var GLOBAL_KEY = /* @__PURE__ */ Symbol.for("next-devtools.server");
function getOrCreateToken(root) {
  const dirs = [
    path4.join(root, "node_modules", ".cache", "next-devtools"),
    path4.join(os.tmpdir(), "next-devtools-" + crypto.createHash("sha1").update(root).digest("hex").slice(0, 12))
  ];
  for (const dir of dirs) {
    try {
      fs3.mkdirSync(dir, { recursive: true });
      const file = path4.join(dir, "token");
      try {
        const existing = fs3.readFileSync(file, "utf8").trim();
        if (existing) return existing;
      } catch {
      }
      const token = crypto.randomBytes(24).toString("hex");
      try {
        fs3.writeFileSync(file, token, { flag: "wx", mode: 384 });
        return token;
      } catch {
        const raced = fs3.readFileSync(file, "utf8").trim();
        if (raced) return raced;
      }
    } catch {
    }
  }
  return crypto.createHash("sha256").update(root + os.hostname() + os.userInfo().username).digest("hex");
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
  const abs = path4.resolve(root, file);
  const rel = path4.relative(root, abs);
  if (rel.startsWith("..") || path4.isAbsolute(rel)) return null;
  return abs;
}
function startDevtoolsServer(opts) {
  const g = globalThis;
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
    res.setHeader("access-control-allow-private-network", "true");
    if (req.method === "OPTIONS") {
      res.statusCode = 204;
      return res.end();
    }
    const url = new URL(req.url || "/", "http://localhost");
    if (url.pathname === "/ping") return send(res, 200, { ok: true, root: path4.basename(opts.root) });
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
          if (!abs || !fs3.existsSync(abs)) return send(res, 404, { error: "file not found in project" });
          const line = Math.max(1, Number(body.line) || 1);
          const column = Math.max(1, Number(body.column) || 1);
          launchEditor(`${abs}:${line}:${column}`, opts.editor, (_f, msg) => {
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
var here = typeof __dirname !== "undefined" ? __dirname : path5.dirname(fileURLToPath2(import.meta.url));
var LOADER_PATH = path5.join(here, "loader.cjs");
function nextMajorMinor(root) {
  try {
    const v = createRequire2(path5.join(root, "package.json"))("next/package.json").version;
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
    const root = path5.resolve(options.root ?? process.cwd());
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
export {
  config_default as default,
  withNextDevtools
};
