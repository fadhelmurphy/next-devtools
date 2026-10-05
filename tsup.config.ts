import { defineConfig } from "tsup";

export default defineConfig([
  {
    entry: { index: "src/index.ts" },
    format: ["esm", "cjs"],
    dts: true,
    platform: "node",
    target: "node18",
    shims: true,
    clean: true,
    external: ["next", "react", "react-dom"],
  },
  {
    entry: { loader: "src/loader/index.ts" },
    format: ["cjs"],
    platform: "node",
    target: "node18",
    // webpack/Turbopack loaders are required() as plain CommonJS: `module.exports = fn`
    footer: {
      js: "if (module.exports && module.exports.default) { const l = module.exports.default; module.exports = l; module.exports.default = l; }",
    },
    outExtension: () => ({ js: ".cjs" }),
  },
]);
