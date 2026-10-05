import fs from "node:fs";
import path from "node:path";
import type { ComponentFile } from "../shared/types";

const toPosix = (p: string) => p.split(path.sep).join("/");
const SKIP_DIRS = new Set(["node_modules", ".next", ".git", "public", "dist", "out", "build", "coverage", ".turbo", ".vercel", "storybook-static"]);
const EXT_RE = /\.(tsx|jsx|js|mjs)$/;
const MAX_FILES = 3000;
const MAX_SIZE = 300 * 1024;
const APP_SPECIAL = /^(page|layout|template|loading|error|global-error|not-found|forbidden|unauthorized|default)$/;

/** Remove line and block comments and trailing commas from JSONC, leaving string contents alone. */
export function stripJsonc(src: string): string {
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

function readTsPaths(root: string): { baseUrl: string; paths: Record<string, string[]> } {
  for (const name of ["tsconfig.json", "jsconfig.json"]) {
    try {
      // tsconfig allows comments and trailing commas
      const raw = stripJsonc(fs.readFileSync(path.join(root, name), "utf8"));
      const co = JSON.parse(raw).compilerOptions ?? {};
      return { baseUrl: path.resolve(root, co.baseUrl ?? "."), paths: co.paths ?? {} };
    } catch {}
  }
  return { baseUrl: root, paths: {} };
}

function resolveImport(spec: string, fromFile: string, ts: ReturnType<typeof readTsPaths>, known: Set<string>): string | null {
  let bases: string[] = [];
  if (spec.startsWith(".")) bases = [path.resolve(path.dirname(fromFile), spec)];
  else {
    for (const [pattern, targets] of Object.entries(ts.paths)) {
      const prefix = pattern.replace(/\*$/, "");
      if (pattern.endsWith("*") ? spec.startsWith(prefix) : spec === pattern) {
        const rest = pattern.endsWith("*") ? spec.slice(prefix.length) : "";
        bases.push(...targets.map((t) => path.resolve(ts.baseUrl, t.replace(/\*$/, rest))));
      }
    }
  }
  for (const base of bases) {
    for (const cand of [base, ...["tsx", "ts", "jsx", "js", "mjs"].flatMap((e) => [`${base}.${e}`, path.join(base, `index.${e}`)])]) {
      if (known.has(cand)) return cand;
    }
  }
  return null;
}

function exportedComponents(code: string, file: string): string[] {
  const names = new Set<string>();
  const patterns = [
    /export\s+default\s+(?:async\s+)?function\s+([A-Z]\w*)/g,
    /export\s+(?:async\s+)?function\s+([A-Z]\w*)/g,
    /export\s+const\s+([A-Z]\w*)\s*(?::[^=]+)?=\s*(?:React\.)?(?:memo|forwardRef|async|\(|function)/g,
    /export\s+class\s+([A-Z]\w*)\s+extends\s+(?:React\.)?(?:Pure)?Component/g,
    /export\s+default\s+([A-Z]\w*)\s*;?\s*$/gm,
    /export\s*\{([^}]+)\}/g,
  ];
  for (const re of patterns) {
    for (const m of code.matchAll(re)) {
      if (re.source.startsWith("export\\s*\\{")) {
        for (const part of m[1].split(",")) {
          const n = part.trim().split(/\s+as\s+/).pop()?.trim();
          if (n && /^[A-Z]\w*$/.test(n)) names.add(n);
        }
      } else names.add(m[1]);
    }
  }
  if (!names.size && /export\s+default\s+(?:async\s+)?(?:function\s*\(|\(|async\s*\()/.test(code)) {
    // anonymous default export: name it after the file, like React DevTools would show "Anonymous"
    const base = path.basename(file).replace(EXT_RE, "");
    names.add(base === "index" ? path.basename(path.dirname(file)) : base);
  }
  return [...names];
}

export function scanComponents(root: string, appDir?: string, pagesDir?: string): ComponentFile[] {
  const files: string[] = [];
  const walk = (dir: string) => {
    let entries: fs.Dirent[] = [];
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const e of entries) {
      if (files.length >= MAX_FILES) return;
      if (e.name.startsWith(".") && e.name !== ".storybook") continue;
      const full = path.join(dir, e.name);
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
  const sources = new Map<string, string>();
  for (const f of files) {
    try {
      if (fs.statSync(f).size <= MAX_SIZE) sources.set(f, fs.readFileSync(f, "utf8"));
    } catch {}
  }

  // Who imports whom
  const usedBy = new Map<string, Set<string>>();
  const importRe = /(?:import|export)\s[^'"]*?from\s*["']([^"']+)["']|import\(\s*["']([^"']+)["']\s*\)/g;
  for (const [file, code] of sources) {
    for (const m of code.matchAll(importRe)) {
      const spec = m[1] || m[2];
      if (!spec || (!spec.startsWith(".") && !Object.keys(ts.paths).length)) continue;
      const target = resolveImport(spec, file, ts, known);
      if (target && target !== file) {
        if (!usedBy.has(target)) usedBy.set(target, new Set());
        usedBy.get(target)!.add(toPosix(path.relative(root, file)));
      }
    }
  }

  const out: ComponentFile[] = [];
  for (const [file, code] of sources) {
    // Must look like it renders JSX
    if (!/<[A-Za-z][\w.]*[\s/>]/.test(code) || !/return|=>/.test(code)) continue;
    const names = exportedComponents(code, file);
    if (!names.length) continue;
    const head = code.slice(0, 400).replace(/^\s*(\/\/.*\n|\/\*[\s\S]*?\*\/\s*)*/, "");
    const directive = head.match(/^["']use (client|server)["']/)?.[1];
    const inApp = !!appDir && file.startsWith(appDir + path.sep);
    const inPages = !!pagesDir && file.startsWith(pagesDir + path.sep);
    const base = path.basename(file).replace(EXT_RE, "");
    const role: ComponentFile["role"] =
      inApp && APP_SPECIAL.test(base) ? (base as ComponentFile["role"]) : inPages ? (base.startsWith("_") ? "pages-special" : "page") : "component";
    out.push({
      file: toPosix(path.relative(root, file)),
      names,
      directive: directive === "client" ? "client" : directive === "server" ? "server" : undefined,
      // In the App Router, files without "use client" render on the server unless a client file imports them.
      runtime: directive === "client" || inPages ? "client" : inApp ? "server" : "shared",
      role,
      usedBy: [...(usedBy.get(file) ?? [])].sort(),
      lines: code.split("\n").length,
    });
  }
  return out.sort((a, b) => a.file.localeCompare(b.file));
}
