import fs from "node:fs";
import path from "node:path";

/* Small, idempotent source edits for `next-devtools init`. String-based on
   purpose: each one either recognises a common shape or reports "manual". */

export type EditResult = { status: "updated" | "already" | "manual"; code: string; reason?: string };

const PKG = "@fadhelmurphy/next-devtools";

export function wrapNextConfig(code: string, file: string): EditResult {
  if (code.includes("withNextDevtools")) return { status: "already", code };
  const isCjs = /\.cjs$/.test(file) || (/\.js$/.test(file) && /module\.exports\s*=/.test(code) && !/^\s*export\s/m.test(code));

  if (isCjs) {
    const m = code.match(/module\.exports\s*=\s*([\s\S]*?);?\s*$/);
    if (!m || m.index === undefined) return { status: "manual", code, reason: "no `module.exports =` found" };
    const value = m[1].trim().replace(/;$/, "");
    const out =
      `const { withNextDevtools } = require("${PKG}");\n` +
      code.slice(0, m.index) +
      `module.exports = withNextDevtools(${value});\n`;
    return { status: "updated", code: out };
  }

  const m = code.match(/export\s+default\s+([\s\S]*?);?\s*$/);
  if (!m || m.index === undefined) return { status: "manual", code, reason: "no `export default` found" };
  const value = m[1].trim().replace(/;$/, "");
  const body = code.slice(0, m.index) + `export default withNextDevtools(${value});\n`;
  return { status: "updated", code: addImport(body, `import { withNextDevtools } from "${PKG}";`) };
}

/** Put an import after the last existing import (or after a leading directive / comment block). */
export function addImport(code: string, line: string): string {
  const importRe = /^import\s[\s\S]*?(?:from\s+)?["'][^"']+["'];?[ \t]*$/gm;
  let last: RegExpExecArray | null = null;
  for (let m; (m = importRe.exec(code)); ) last = m;
  if (last) {
    const at = last.index + last[0].length;
    return code.slice(0, at) + "\n" + line + code.slice(at);
  }
  const directive = code.match(/^\s*["']use (client|server)["'];?\s*\n/);
  if (directive) return code.slice(0, directive[0].length) + line + "\n" + code.slice(directive[0].length);
  return line + "\n" + code;
}

export function addToRootLayout(code: string): EditResult {
  if (code.includes("NextDevtools")) return { status: "already", code };
  const close = code.lastIndexOf("</body>");
  if (close === -1) return { status: "manual", code, reason: "no `</body>` found" };
  const lineStart = code.lastIndexOf("\n", close) + 1;
  const indent = code.slice(lineStart, close).match(/^\s*/)?.[0] ?? "";
  const inner = indent.length === close - lineStart ? indent + "  " : indent;
  const inserted =
    indent.length === close - lineStart
      ? code.slice(0, lineStart) + `${inner}<NextDevtools />\n` + code.slice(lineStart)
      : code.slice(0, close) + `<NextDevtools />` + code.slice(close);
  return { status: "updated", code: addImport(inserted, `import { NextDevtools } from "${PKG}/client";`) };
}

export function addToPagesApp(code: string): EditResult {
  if (code.includes("NextDevtools")) return { status: "already", code };
  const m = code.match(/<Component\s+\{\s*\.\.\.pageProps\s*\}\s*\/>/);
  if (!m || m.index === undefined) return { status: "manual", code, reason: "no `<Component {...pageProps} />` found" };
  const out = code.slice(0, m.index) + `<><Component {...pageProps} /><NextDevtools /></>` + code.slice(m.index + m[0].length);
  return { status: "updated", code: addImport(out, `import { NextDevtools } from "${PKG}/client";`) };
}

const EXTS = ["tsx", "jsx", "ts", "js"];

export function findFiles(root: string) {
  const first = (cands: string[]) => cands.map((c) => path.join(root, c)).find((p) => fs.existsSync(p));
  const config = first(["next.config.ts", "next.config.mts", "next.config.mjs", "next.config.js", "next.config.cjs"]);
  const layout = first(["app", "src/app"].flatMap((d) => EXTS.map((e) => `${d}/layout.${e}`)));
  const pagesApp = first(["pages", "src/pages"].flatMap((d) => EXTS.map((e) => `${d}/_app.${e}`)));
  const pagesDir = first(["pages", "src/pages"]);
  return { config, layout, pagesApp, pagesDir };
}
