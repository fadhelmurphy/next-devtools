#!/usr/bin/env node
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

// src/cli/index.ts
var cli_exports = {};
__export(cli_exports, {
  run: () => run
});
module.exports = __toCommonJS(cli_exports);
var import_node_fs2 = __toESM(require("fs"), 1);
var import_node_path2 = __toESM(require("path"), 1);
var import_node_child_process = require("child_process");

// src/cli/codemods.ts
var import_node_fs = __toESM(require("fs"), 1);
var import_node_path = __toESM(require("path"), 1);
var PKG = "@fadhelmurphy/next-devtools";
function wrapNextConfig(code, file) {
  if (code.includes("withNextDevtools")) return { status: "already", code };
  const isCjs = /\.cjs$/.test(file) || /\.js$/.test(file) && /module\.exports\s*=/.test(code) && !/^\s*export\s/m.test(code);
  if (isCjs) {
    const m2 = code.match(/module\.exports\s*=\s*([\s\S]*?);?\s*$/);
    if (!m2 || m2.index === void 0) return { status: "manual", code, reason: "no `module.exports =` found" };
    const value2 = m2[1].trim().replace(/;$/, "");
    const out = `const { withNextDevtools } = require("${PKG}");
` + code.slice(0, m2.index) + `module.exports = withNextDevtools(${value2});
`;
    return { status: "updated", code: out };
  }
  const m = code.match(/export\s+default\s+([\s\S]*?);?\s*$/);
  if (!m || m.index === void 0) return { status: "manual", code, reason: "no `export default` found" };
  const value = m[1].trim().replace(/;$/, "");
  const body = code.slice(0, m.index) + `export default withNextDevtools(${value});
`;
  return { status: "updated", code: addImport(body, `import { withNextDevtools } from "${PKG}";`) };
}
function addImport(code, line) {
  const importRe = /^import\s[\s\S]*?(?:from\s+)?["'][^"']+["'];?[ \t]*$/gm;
  let last = null;
  for (let m; m = importRe.exec(code); ) last = m;
  if (last) {
    const at = last.index + last[0].length;
    return code.slice(0, at) + "\n" + line + code.slice(at);
  }
  const directive = code.match(/^\s*["']use (client|server)["'];?\s*\n/);
  if (directive) return code.slice(0, directive[0].length) + line + "\n" + code.slice(directive[0].length);
  return line + "\n" + code;
}
function addToRootLayout(code) {
  if (code.includes("NextDevtools")) return { status: "already", code };
  const close = code.lastIndexOf("</body>");
  if (close === -1) return { status: "manual", code, reason: "no `</body>` found" };
  const lineStart = code.lastIndexOf("\n", close) + 1;
  const indent = code.slice(lineStart, close).match(/^\s*/)?.[0] ?? "";
  const inner = indent.length === close - lineStart ? indent + "  " : indent;
  const inserted = indent.length === close - lineStart ? code.slice(0, lineStart) + `${inner}<NextDevtools />
` + code.slice(lineStart) : code.slice(0, close) + `<NextDevtools />` + code.slice(close);
  return { status: "updated", code: addImport(inserted, `import { NextDevtools } from "${PKG}/client";`) };
}
function addToPagesApp(code) {
  if (code.includes("NextDevtools")) return { status: "already", code };
  const m = code.match(/<Component\s+\{\s*\.\.\.pageProps\s*\}\s*\/>/);
  if (!m || m.index === void 0) return { status: "manual", code, reason: "no `<Component {...pageProps} />` found" };
  const out = code.slice(0, m.index) + `<><Component {...pageProps} /><NextDevtools /></>` + code.slice(m.index + m[0].length);
  return { status: "updated", code: addImport(out, `import { NextDevtools } from "${PKG}/client";`) };
}
var EXTS = ["tsx", "jsx", "ts", "js"];
function findFiles(root) {
  const first = (cands) => cands.map((c2) => import_node_path.default.join(root, c2)).find((p) => import_node_fs.default.existsSync(p));
  const config = first(["next.config.ts", "next.config.mts", "next.config.mjs", "next.config.js", "next.config.cjs"]);
  const layout = first(["app", "src/app"].flatMap((d) => EXTS.map((e) => `${d}/layout.${e}`)));
  const pagesApp = first(["pages", "src/pages"].flatMap((d) => EXTS.map((e) => `${d}/_app.${e}`)));
  const pagesDir = first(["pages", "src/pages"]);
  return { config, layout, pagesApp, pagesDir };
}

// src/cli/index.ts
var PKG2 = "@fadhelmurphy/next-devtools";
var GITHUB_SPEC = "github:fadhelmurphy/next-devtools";
var c = {
  bold: (s) => `\x1B[1m${s}\x1B[22m`,
  dim: (s) => `\x1B[2m${s}\x1B[22m`,
  green: (s) => `\x1B[32m${s}\x1B[39m`,
  yellow: (s) => `\x1B[33m${s}\x1B[39m`,
  red: (s) => `\x1B[31m${s}\x1B[39m`,
  cyan: (s) => `\x1B[36m${s}\x1B[39m`
};
var HELP = `
${c.bold("next-devtools")} \u2014 add Next DevTools to a Next.js project

${c.bold("Usage")}
  npx ${GITHUB_SPEC} init [options]

${c.bold("Options")}
  --npm          Install from the npm registry instead of GitHub
  --no-install   Only edit files, don't install the package
  --dry-run      Show what would change, write nothing
  --cwd <dir>    Project directory (default: current directory)
  -h, --help     Show this help
`;
function detectPm(root) {
  const has = (f) => import_node_fs2.default.existsSync(import_node_path2.default.join(root, f));
  if (has("pnpm-lock.yaml")) return { name: "pnpm", add: ["pnpm", "add", "-D"] };
  if (has("yarn.lock")) return { name: "yarn", add: ["yarn", "add", "-D"] };
  if (has("bun.lockb") || has("bun.lock")) return { name: "bun", add: ["bun", "add", "-d"] };
  return { name: "npm", add: ["npm", "install", "-D"] };
}
function report(label, file, root, r) {
  const rel = file ? import_node_path2.default.relative(root, file) : "";
  if (!r) return;
  if (r.status === "updated") console.log(`  ${c.green("\u2714")} ${label} ${c.dim(rel)}`);
  else if (r.status === "already") console.log(`  ${c.dim("\u2022")} ${label} ${c.dim(rel + " (already set up)")}`);
  else console.log(`  ${c.yellow("!")} ${label} ${c.dim(rel)} \u2014 ${r.reason}; add it by hand (see README)`);
}
function run(argv) {
  const args = argv.slice(2);
  if (!args.length || args.includes("-h") || args.includes("--help")) {
    console.log(HELP);
    return 0;
  }
  const cmd = args[0];
  if (cmd !== "init") {
    console.error(c.red(`Unknown command "${cmd}".`) + HELP);
    return 1;
  }
  const flag = (f) => args.includes(f);
  const cwdIdx = args.indexOf("--cwd");
  const root = import_node_path2.default.resolve(cwdIdx > -1 ? args[cwdIdx + 1] ?? "." : process.cwd());
  const dry = flag("--dry-run");
  let pkg;
  try {
    pkg = JSON.parse(import_node_fs2.default.readFileSync(import_node_path2.default.join(root, "package.json"), "utf8"));
  } catch {
    console.error(c.red(`No package.json in ${root}. Run this inside your Next.js project.`));
    return 1;
  }
  if (!pkg.dependencies?.next && !pkg.devDependencies?.next) {
    console.error(c.red(`"next" isn't a dependency of ${pkg.name ?? root}. Run this inside your Next.js project.`));
    return 1;
  }
  console.log(`
${c.cyan("\u25C6")} ${c.bold("Next DevTools")} ${c.dim("\u2192 " + (pkg.name ?? import_node_path2.default.basename(root)))}
`);
  if (!flag("--no-install")) {
    const pm = detectPm(root);
    const spec = flag("--npm") ? PKG2 : GITHUB_SPEC;
    const cmdline = [...pm.add, spec];
    console.log(`  ${c.dim("$")} ${cmdline.join(" ")}`);
    if (!dry) {
      const res = (0, import_node_child_process.spawnSync)(cmdline[0], cmdline.slice(1), { cwd: root, stdio: "inherit", shell: process.platform === "win32" });
      if (res.status !== 0) {
        console.error(c.red(`
  Install failed. Fix the error above, or rerun with --no-install after installing ${spec} yourself.`));
        return 1;
      }
    }
  }
  const files = findFiles(root);
  const write = (file, r) => {
    if (r.status === "updated" && !dry) import_node_fs2.default.writeFileSync(file, r.code);
  };
  if (files.config) {
    const r = wrapNextConfig(import_node_fs2.default.readFileSync(files.config, "utf8"), files.config);
    write(files.config, r);
    report("Wrapped config with withNextDevtools()", files.config, root, r);
  } else {
    const file = import_node_path2.default.join(root, "next.config.mjs");
    const code = `import { withNextDevtools } from "${PKG2}";

/** @type {import('next').NextConfig} */
const nextConfig = {};

export default withNextDevtools(nextConfig);
`;
    if (!dry) import_node_fs2.default.writeFileSync(file, code);
    report("Created config with withNextDevtools()", file, root, { status: "updated", code });
  }
  let mounted = false;
  if (files.layout) {
    const r = addToRootLayout(import_node_fs2.default.readFileSync(files.layout, "utf8"));
    write(files.layout, r);
    report("Added <NextDevtools /> to the root layout", files.layout, root, r);
    mounted ||= r.status !== "manual";
  }
  if (files.pagesApp) {
    const r = addToPagesApp(import_node_fs2.default.readFileSync(files.pagesApp, "utf8"));
    write(files.pagesApp, r);
    report("Added <NextDevtools /> to _app", files.pagesApp, root, r);
    mounted ||= r.status !== "manual";
  } else if (files.pagesDir && !files.layout) {
    const ts = import_node_fs2.default.existsSync(import_node_path2.default.join(root, "tsconfig.json"));
    const file = import_node_path2.default.join(files.pagesDir, ts ? "_app.tsx" : "_app.jsx");
    const code = ts ? `import type { AppProps } from "next/app";
import { NextDevtools } from "${PKG2}/client";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <Component {...pageProps} />
      <NextDevtools />
    </>
  );
}
` : `import { NextDevtools } from "${PKG2}/client";

export default function App({ Component, pageProps }) {
  return (
    <>
      <Component {...pageProps} />
      <NextDevtools />
    </>
  );
}
`;
    if (!dry) import_node_fs2.default.writeFileSync(file, code);
    report("Created _app with <NextDevtools />", file, root, { status: "updated", code });
    mounted = true;
  }
  if (!files.layout && !files.pagesDir) {
    console.log(`  ${c.yellow("!")} No app/layout or pages/ found \u2014 render <NextDevtools /> from "${PKG2}/client" yourself.`);
  }
  console.log(
    `
  ${dry ? c.yellow("Dry run \u2014 nothing was written.") : c.green("Done.")} ` + (mounted ? `Run ${c.bold(`${detectPm(root).name} run dev`)} and press ${c.bold("Shift + Alt + D")}.
` : "\n")
  );
  return 0;
}
process.exitCode = run(process.argv);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  run
});
