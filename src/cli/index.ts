import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { addToPagesApp, addToRootLayout, findFiles, wrapNextConfig, type EditResult } from "./codemods";

const PKG = "@fadhelmurphy/next-devtools";
const GITHUB_SPEC = "github:fadhelmurphy/next-devtools";

const c = {
  bold: (s: string) => `\x1b[1m${s}\x1b[22m`,
  dim: (s: string) => `\x1b[2m${s}\x1b[22m`,
  green: (s: string) => `\x1b[32m${s}\x1b[39m`,
  yellow: (s: string) => `\x1b[33m${s}\x1b[39m`,
  red: (s: string) => `\x1b[31m${s}\x1b[39m`,
  cyan: (s: string) => `\x1b[36m${s}\x1b[39m`,
};

const HELP = `
${c.bold("next-devtools")} — add Next DevTools to a Next.js project

${c.bold("Usage")}
  npx ${GITHUB_SPEC} init [options]

${c.bold("Options")}
  --npm          Install from the npm registry instead of GitHub
  --no-install   Only edit files, don't install the package
  --dry-run      Show what would change, write nothing
  --cwd <dir>    Project directory (default: current directory)
  -h, --help     Show this help
`;

function detectPm(root: string): { name: string; add: string[] } {
  const has = (f: string) => fs.existsSync(path.join(root, f));
  if (has("pnpm-lock.yaml")) return { name: "pnpm", add: ["pnpm", "add", "-D"] };
  if (has("yarn.lock")) return { name: "yarn", add: ["yarn", "add", "-D"] };
  if (has("bun.lockb") || has("bun.lock")) return { name: "bun", add: ["bun", "add", "-d"] };
  // --include=dev: with NODE_ENV=production npm would record the devDependency but not install it
  return { name: "npm", add: ["npm", "install", "-D", "--include=dev"] };
}

function report(label: string, file: string | undefined, root: string, r: EditResult | null) {
  const rel = file ? path.relative(root, file) : "";
  if (!r) return;
  if (r.status === "updated") console.log(`  ${c.green("✔")} ${label} ${c.dim(rel)}`);
  else if (r.status === "already") console.log(`  ${c.dim("•")} ${label} ${c.dim(rel + " (already set up)")}`);
  else console.log(`  ${c.yellow("!")} ${label} ${c.dim(rel)} — ${r.reason}; add it by hand (see README)`);
}

/** Installed Next.js major, else the one in package.json's range, else "recent". */
function nextMajor(root: string, pkg: any): number {
  try {
    const v = JSON.parse(fs.readFileSync(path.join(root, "node_modules", "next", "package.json"), "utf8")).version;
    return parseInt(v, 10) || 99;
  } catch {}
  const range: string = pkg.dependencies?.next ?? pkg.devDependencies?.next ?? "";
  const m = range.match(/(\d+)/);
  return m ? parseInt(m[1], 10) : 99;
}

export function run(argv: string[]): number {
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
  const flag = (f: string) => args.includes(f);
  const cwdIdx = args.indexOf("--cwd");
  const root = path.resolve(cwdIdx > -1 ? args[cwdIdx + 1] ?? "." : process.cwd());
  const dry = flag("--dry-run");

  let pkg: any;
  try {
    pkg = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));
  } catch {
    console.error(c.red(`No package.json in ${root}. Run this inside your Next.js project.`));
    return 1;
  }
  if (!pkg.dependencies?.next && !pkg.devDependencies?.next) {
    console.error(c.red(`"next" isn't a dependency of ${pkg.name ?? root}. Run this inside your Next.js project.`));
    return 1;
  }

  console.log(`\n${c.cyan("◆")} ${c.bold("Next DevTools")} ${c.dim("→ " + (pkg.name ?? path.basename(root)))}\n`);

  // 1. install
  if (!flag("--no-install")) {
    const pm = detectPm(root);
    const spec = flag("--npm") ? PKG : GITHUB_SPEC;
    const cmdline = [...pm.add, spec];
    console.log(`  ${c.dim("$")} ${cmdline.join(" ")}`);
    if (!dry) {
      const res = spawnSync(cmdline[0], cmdline.slice(1), { cwd: root, stdio: "inherit", shell: process.platform === "win32" });
      if (res.status !== 0) {
        console.error(c.red(`\n  Install failed. Fix the error above, or rerun with --no-install after installing ${spec} yourself.`));
        return 1;
      }
    }
  }

  // 2. edit files
  const files = findFiles(root);
  const write = (file: string, r: EditResult) => {
    if (r.status === "updated" && !dry) fs.writeFileSync(file, r.code);
  };

  if (files.config) {
    const r = wrapNextConfig(fs.readFileSync(files.config, "utf8"), files.config);
    write(files.config, r);
    report("Wrapped config with withNextDevtools()", files.config, root, r);
  } else {
    // next.config.mjs needs Next 12+; CommonJS works everywhere.
    const legacy = nextMajor(root, pkg) < 12;
    const file = path.join(root, legacy ? "next.config.js" : "next.config.mjs");
    const code = legacy
      ? `const { withNextDevtools } = require("${PKG}");\n\n/** @type {import('next').NextConfig} */\nconst nextConfig = {};\n\nmodule.exports = withNextDevtools(nextConfig);\n`
      : `import { withNextDevtools } from "${PKG}";\n\n/** @type {import('next').NextConfig} */\nconst nextConfig = {};\n\nexport default withNextDevtools(nextConfig);\n`;
    if (!dry) fs.writeFileSync(file, code);
    report("Created config with withNextDevtools()", file, root, { status: "updated", code });
  }

  let mounted = false;
  if (files.layout) {
    const r = addToRootLayout(fs.readFileSync(files.layout, "utf8"));
    write(files.layout, r);
    report("Added <NextDevtools /> to the root layout", files.layout, root, r);
    mounted ||= r.status !== "manual";
  }
  if (files.pagesApp) {
    const r = addToPagesApp(fs.readFileSync(files.pagesApp, "utf8"));
    write(files.pagesApp, r);
    report("Added <NextDevtools /> to _app", files.pagesApp, root, r);
    mounted ||= r.status !== "manual";
  } else if (files.pagesDir && !files.layout) {
    const ts = fs.existsSync(path.join(root, "tsconfig.json"));
    const file = path.join(files.pagesDir, ts ? "_app.tsx" : "_app.jsx");
    const code = ts
      ? `import type { AppProps } from "next/app";\nimport { NextDevtools } from "${PKG}/client";\n\nexport default function App({ Component, pageProps }: AppProps) {\n  return (\n    <>\n      <Component {...pageProps} />\n      <NextDevtools />\n    </>\n  );\n}\n`
      : `import { NextDevtools } from "${PKG}/client";\n\nexport default function App({ Component, pageProps }) {\n  return (\n    <>\n      <Component {...pageProps} />\n      <NextDevtools />\n    </>\n  );\n}\n`;
    if (!dry) fs.writeFileSync(file, code);
    report("Created _app with <NextDevtools />", file, root, { status: "updated", code });
    mounted = true;
  }
  if (!files.layout && !files.pagesDir) {
    console.log(`  ${c.yellow("!")} No app/layout or pages/ found — render <NextDevtools /> from "${PKG}/client" yourself.`);
  }

  console.log(
    `\n  ${dry ? c.yellow("Dry run — nothing was written.") : c.green("Done.")} ` +
      (mounted ? `Run ${c.bold(`${detectPm(root).name} run dev`)} and press ${c.bold("Shift + Alt + D")}.\n` : "\n"),
  );
  return 0;
}

process.exitCode = run(process.argv);
