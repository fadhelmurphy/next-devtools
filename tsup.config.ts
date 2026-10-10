import { defineConfig } from "tsup";

export default defineConfig([
  {
    entry: { index: "src/index.ts" },
    format: ["esm", "cjs"],
    dts: true,
    platform: "node",
    target: "node14",
    shims: true,
    clean: true,
    external: ["next", "react", "react-dom"],
  },
  {
    // CommonJS twin of the client entry for servers that require() it: Next.js 10/11
    // externalise node_modules during SSR, and Node < 22 can't require() ESM.
    // The panel itself (./mount.js) only ever loads in the browser.
    entry: { "client/index": "src/client/index.tsx" },
    format: ["cjs"],
    platform: "neutral",
    target: "es2017",
    external: ["react", /\.\/mount\.js$/],
    banner: { js: '"use client";' },
    outExtension: () => ({ js: ".cjs" }),
    esbuildOptions(o) {
      o.jsx = "automatic";
      o.mainFields = ["module", "main"];
    },
  },
  {
    entry: { cli: "src/cli/index.ts" },
    format: ["cjs"],
    platform: "node",
    target: "node14",
    banner: { js: "#!/usr/bin/env node" },
    outExtension: () => ({ js: ".cjs" }),
  },
  {
    entry: { loader: "src/loader/index.ts" },
    format: ["cjs"],
    platform: "node",
    target: "node14",
    // webpack/Turbopack loaders are required() as plain CommonJS: `module.exports = fn`
    footer: {
      js: "if (module.exports && module.exports.default) { const l = module.exports.default; module.exports = l; module.exports.default = l; }",
    },
    outExtension: () => ({ js: ".cjs" }),
  },
]);
