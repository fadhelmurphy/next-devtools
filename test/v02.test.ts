import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { editorUrl } from "../src/client/api";
import { windowsPathOf, resolveEditor } from "../src/config/editor";
import { scanComponents } from "../src/config/components";
import { updateType } from "../src/config/packages";
import { serialize } from "../src/config/runtime-config";
import { extractParams } from "../src/client/nav";

describe("editor URLs", () => {
  const loc = { file: "app/page.tsx", line: 3, column: 5 };
  it("maps WSL /mnt/<drive> paths to Windows paths", () => {
    expect(windowsPathOf("/mnt/c/Users/me/app/page.tsx")).toBe("C:/Users/me/app/page.tsx");
    expect(editorUrl("vscode", "/mnt/c/Users/me/app/page.tsx", loc)).toBe("vscode://file/C:/Users/me/app/page.tsx:3:5");
  });
  it("uses the WSL remote for files inside the Linux filesystem", () => {
    expect(editorUrl("vscode", "/home/me/app/page.tsx", loc, { ok: false, wsl: "Ubuntu" })).toBe(
      "vscode://vscode-remote/wsl+Ubuntu/home/me/app/page.tsx:3:5",
    );
  });
  it("plain paths and other editors", () => {
    expect(editorUrl("cursor", "/Users/me/app/page.tsx", loc)).toBe("cursor://file/Users/me/app/page.tsx:3:5");
    expect(editorUrl("webstorm", "/a/b.tsx", loc)).toBe("webstorm://open?file=%2Fa%2Fb.tsx&line=3&column=5");
  });
  it("prefers an explicit editor", () => {
    expect(resolveEditor("cursor")).toBe("cursor");
  });
});

describe("scanComponents", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "nd-comps-"));
  const w = (f: string, c: string) => {
    fs.mkdirSync(path.dirname(path.join(root, f)), { recursive: true });
    fs.writeFileSync(path.join(root, f), c);
  };
  w("tsconfig.json", `{ // comment\n "compilerOptions": { "paths": { "@/*": ["./*"] }, }, }`);
  w("app/layout.tsx", `export default function RootLayout({children}) { return <html><body>{children}</body></html> }`);
  w("app/page.tsx", `import { Counter } from "@/components/Counter";\nimport Card from "../components/Card";\nexport default function Home() { return <main><Counter /><Card /></main> }`);
  w("components/Counter.tsx", `"use client";\nexport function Counter() { return <button>1</button> }`);
  w("components/Card.jsx", `const Card = () => <div />;\nexport default Card;`);
  w("lib/util.ts", `export const add = (a, b) => a + b;`);
  const list = scanComponents(root, path.join(root, "app"));
  const by = (f: string) => list.find((c) => c.file === f)!;

  it("finds components with their runtime and role", () => {
    expect(list.map((c) => c.file).sort()).toEqual(["app/layout.tsx", "app/page.tsx", "components/Card.jsx", "components/Counter.tsx"]);
    expect(by("app/page.tsx")).toMatchObject({ names: ["Home"], runtime: "server", role: "page" });
    expect(by("components/Counter.tsx")).toMatchObject({ runtime: "client", directive: "client" });
    expect(by("components/Card.jsx")).toMatchObject({ names: ["Card"], runtime: "shared" });
  });
  it("resolves imports through tsconfig paths and relative specifiers", () => {
    expect(by("components/Counter.tsx").usedBy).toEqual(["app/page.tsx"]);
    expect(by("components/Card.jsx").usedBy).toEqual(["app/page.tsx"]);
  });
});

describe("helpers", () => {
  it("classifies updates", () => {
    expect(updateType("15.5.2", "16.0.1")).toBe("major");
    expect(updateType("16.1.0", "16.3.8")).toBe("minor");
    expect(updateType("16.3.7", "16.3.8")).toBe("patch");
    expect(updateType("16.3.8", "16.3.8")).toBeUndefined();
  });
  it("serializes configs with functions and regexes", () => {
    expect(serialize({ a: () => 1, r: /x/g, n: { b: [1, "s"] } })).toEqual({ a: "ƒ a()", r: "/x/g", n: { b: [1, "s"] } });
  });
  it("extracts route params", () => {
    expect(extractParams("/blog/[slug]", "/blog/hello%20x")).toEqual({ slug: "hello x" });
    expect(extractParams("/docs/[...path]", "/docs/a/b")).toEqual({ path: ["a", "b"] });
  });
});

describe("resolveEditor fallbacks", () => {
  it("never auto-picks a terminal editor from $EDITOR", () => {
    const saved = { EDITOR: process.env.EDITOR, VISUAL: process.env.VISUAL, PATH: process.env.PATH, LAUNCH_EDITOR: process.env.LAUNCH_EDITOR };
    process.env.EDITOR = "vi";
    process.env.VISUAL = "vim";
    delete process.env.LAUNCH_EDITOR;
    process.env.PATH = "/nonexistent";
    try {
      expect(resolveEditor()).toBeNull();
    } finally {
      Object.assign(process.env, saved);
    }
  });
});

import { stripJsonc } from "../src/config/components";
describe("stripJsonc", () => {
  it("keeps glob strings that look like comments", () => {
    const src = `{\n  // comment\n  "paths": { "@/*": ["./*"] }, /* block */\n  "include": [".next/types/**/*.ts", "**/*.tsx",],\n}`;
    expect(JSON.parse(stripJsonc(src))).toEqual({ paths: { "@/*": ["./*"] }, include: [".next/types/**/*.ts", "**/*.tsx"] });
  });
});
