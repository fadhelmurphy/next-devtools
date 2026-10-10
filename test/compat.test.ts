import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { withNextDevtools } from "../src/config/index";

/** A fake project with given next/react versions installed. */
function project(next: string, react: string) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "nd-compat-"));
  fs.writeFileSync(path.join(root, "package.json"), JSON.stringify({ name: "p", dependencies: { next, react } }));
  for (const [name, version] of [["next", next], ["react", react]]) {
    fs.mkdirSync(path.join(root, "node_modules", name), { recursive: true });
    fs.writeFileSync(path.join(root, "node_modules", name, "package.json"), JSON.stringify({ name, version }));
  }
  return root;
}

const DEV = "phase-development-server";
const ctx = { defaultConfig: {} };
const run = (next: string, react: string, input: any = {}) =>
  withNextDevtools(input, { root: project(next, react), port: 0 })(DEV, ctx) as Record<string, any>;

function webpackResult(config: Record<string, any>) {
  return config.webpack({ module: { rules: [] }, plugins: [] }, { dev: true, isServer: false });
}

describe("config wrapper across Next.js versions", () => {
  it("returns synchronously for object/sync configs (Next < 12.1 rejects Promises)", () => {
    const out = withNextDevtools({ a: 1 }, { root: project("10.2.3", "17.0.2"), port: 0 })(DEV, ctx);
    expect(typeof (out as any).then).toBe("undefined");
    expect((out as any).a).toBe(1);
  });

  it("passes through async user configs", async () => {
    const out = withNextDevtools(async () => ({ b: 2 }), { root: project("16.0.0", "19.0.0"), port: 0 })(DEV, ctx);
    expect(typeof (out as any).then).toBe("function");
    expect((await out).b).toBe(2);
  });

  it("leaves production phases untouched", () => {
    const input = { reactStrictMode: true };
    const out = withNextDevtools(input)("phase-production-build", ctx);
    expect(out).toEqual(input);
  });

  it("Next 10 / React 17: webpack loader + legacy React root, no Turbopack config", () => {
    const cfg = run("10.2.3", "17.0.2");
    expect(cfg.turbopack).toBeUndefined();
    expect(cfg.experimental?.turbo).toBeUndefined();
    const wp = webpackResult(cfg);
    expect(wp.module.rules[0].enforce).toBe("pre");
    expect(wp.plugins.map((p: any) => p.constructor.name)).toContain("LegacyReactRootPlugin");
  });

  it("React 18+: no legacy root plugin", () => {
    const wp = webpackResult(run("13.5.11", "18.3.1"));
    expect(wp.plugins).toHaveLength(0);
  });

  it("Next 13: no Turbopack config (alpha, different shape)", () => {
    const cfg = run("13.5.11", "18.3.1");
    expect(cfg.experimental?.turbo).toBeUndefined();
  });

  it("Next 14: experimental.turbo for .jsx only", () => {
    const rules = run("14.2.35", "18.3.1").experimental.turbo.rules;
    expect(Object.keys(rules)).toEqual(["*.jsx"]);
    expect(rules["*.jsx"].as).toBeUndefined();
  });

  it("Next 15.0–15.2: experimental.turbo for .tsx and .jsx without `as`", () => {
    const rules = run("15.2.6", "19.0.0").experimental.turbo.rules;
    expect(Object.keys(rules).sort()).toEqual(["*.jsx", "*.tsx"]);
    expect(rules["*.tsx"].as).toBeUndefined();
  });

  it("Next 15.3+: turbopack.rules", () => {
    const cfg = run("15.5.0", "19.0.0");
    expect(Object.keys(cfg.turbopack.rules).sort()).toEqual(["*.jsx", "*.tsx"]);
    expect(cfg.experimental?.turbo).toBeUndefined();
  });

  it("Next 16: conditioned rules that skip node_modules", () => {
    const rules = run("16.3.8", "19.3.0").turbopack.rules;
    expect(rules["*.tsx"][0].condition).toEqual({ not: "foreign" });
  });

  it("keeps the user's webpack function", () => {
    let called = false;
    const cfg = run("12.3.4", "17.0.2", {
      webpack: (c: any) => {
        called = true;
        return c;
      },
    });
    webpackResult(cfg);
    expect(called).toBe(true);
  });
});
