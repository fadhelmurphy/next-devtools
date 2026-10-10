import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { getOrCreateToken, startDevtoolsServer } from "./server";
import { rememberConfig } from "./runtime-config";

// next.config may be a plain object, a function, or an async function.
type NextConfigObject = Record<string, any>;
type NextConfigFn = (phase: string, ctx: { defaultConfig: NextConfigObject }) => NextConfigObject | Promise<NextConfigObject>;
export type NextConfigInput = NextConfigObject | NextConfigFn;

export interface NextDevtoolsOptions {
  /** Turn the whole thing off without removing the wrapper. Default: `true`. */
  enabled?: boolean;
  /** Port of the local API used for routes, assets and open-in-editor. Default: `4590` or `NEXT_DEVTOOLS_PORT`. */
  port?: number;
  /** Editor binary for open-in-editor (`code`, `cursor`, `webstorm`, `zed`…). Defaults to `LAUNCH_EDITOR` / auto-detect. */
  editor?: string;
  /** Project root. Default: `process.cwd()` — set it when running `next dev <dir>` from elsewhere. */
  root?: string;
  /** Inject `data-nd-src` attributes for the inspector. Default: `true`. */
  inspector?: boolean;
}

const PHASE_DEVELOPMENT_SERVER = "phase-development-server";
const DEFAULT_PORT = 4590;

const here = typeof __dirname !== "undefined" ? __dirname : path.dirname(fileURLToPath(import.meta.url));
const LOADER_PATH = path.join(here, "loader.cjs");

function majorMinorOf(root: string, pkg: string, fallback: [number, number]): [number, number] {
  try {
    const v: string = createRequire(path.join(root, "package.json"))(`${pkg}/package.json`).version;
    const [maj, min] = v.split(".").map(Number);
    return [maj || 0, min || 0];
  } catch {
    return fallback;
  }
}

/** Client files that render the panel's React root: `createRoot` (React 18+) or `ReactDOM.render` (React 17). */
const ROOT_MODERN = /[\\/]dist[\\/]client[\\/]root\.js$/;
const ROOT_LEGACY = path.join(here, "client", "root-legacy.js");

/**
 * Swaps the panel's `createRoot` module for a `ReactDOM.render` one on React 17,
 * where `react-dom/client` doesn't exist. Hooks the module factory directly so
 * it works on webpack 4 (Next 10) and webpack 5 alike.
 */
class LegacyReactRootPlugin {
  apply(compiler: any) {
    compiler.hooks.normalModuleFactory.tap("NextDevtoolsLegacyRoot", (nmf: any) => {
      nmf.hooks.afterResolve.tap("NextDevtoolsLegacyRoot", (data: any) => {
        const target = data?.createData ?? data; // webpack 5 : webpack 4
        if (target?.resource && ROOT_MODERN.test(target.resource)) {
          target.resource = ROOT_LEGACY;
          if (target.userRequest) target.userRequest = ROOT_LEGACY;
        }
        return data && !data.createData ? data : undefined; // webpack 4 waterfall expects the data back
      });
    });
  }
}

function addWebpackRule(config: NextConfigObject, root: string, inspector: boolean, legacyReact: boolean) {
  const userWebpack = config.webpack;
  config.webpack = (webpackConfig: any, ctx: any) => {
    const result = typeof userWebpack === "function" ? userWebpack(webpackConfig, ctx) : webpackConfig;
    if (ctx?.dev) {
      if (inspector) {
        result.module = result.module || {};
        result.module.rules = result.module.rules || [];
        result.module.rules.unshift({
          test: /\.(jsx|tsx|js|mjs)$/,
          exclude: /[\\/]node_modules[\\/]/,
          enforce: "pre",
          use: [{ loader: LOADER_PATH, options: { root } }],
        });
      }
      if (legacyReact) {
        result.plugins = result.plugins || [];
        result.plugins.push(new LegacyReactRootPlugin());
      }
    }
    return result;
  };
}

function addTurbopackRules(config: NextConfigObject, root: string, [major, minor]: [number, number]) {
  const loader = { loader: LOADER_PATH, options: { root } };

  if (major >= 16) {
    // Next 16+: rule collections + conditions, so we can skip node_modules ("foreign") entirely.
    config.turbopack = config.turbopack || {};
    const rules = (config.turbopack.rules = config.turbopack.rules || {});
    for (const glob of ["*.tsx", "*.jsx", "*.js"]) {
      const item = { loaders: [loader], condition: { not: "foreign" } };
      const existing = rules[glob];
      if (!existing) rules[glob] = [item];
      else rules[glob] = [item, ...(Array.isArray(existing) ? existing : [existing])];
    }
    return;
  }

  // Turbopack before Next 14 was alpha with a different config shape; leave it alone.
  if (major < 14) return;

  // Next 14 – 15.x: single rule per glob, no conditions. The loader itself bails on node_modules.
  const stable = major > 15 || (major === 15 && minor >= 3);
  const target = stable
    ? (config.turbopack = config.turbopack || {})
    : ((config.experimental = config.experimental || {}), (config.experimental.turbo = config.experimental.turbo || {}));
  const rules = (target.rules = target.rules || {});
  // Next 14's Turbopack parses loader output as plain JS (TypeScript fails), and its
  // `as: "*.tsx"` workaround breaks "use client" imports — so only .jsx gets tagged there.
  const globs = major === 14 ? ["*.jsx"] : ["*.tsx", "*.jsx"];
  for (const glob of globs) {
    if (rules[glob]) {
      console.warn(`[next-devtools] a Turbopack rule for "${glob}" already exists; inspector source mapping is disabled for those files.`);
      continue;
    }
    rules[glob] = { loaders: [loader] };
  }
}

/**
 * Wrap your Next.js config:
 *
 * ```ts
 * // next.config.ts
 * import { withNextDevtools } from "@fadhelmurphy/next-devtools";
 * export default withNextDevtools({ reactStrictMode: true });
 * ```
 *
 * Does nothing outside `next dev`.
 */
export function withNextDevtools(nextConfig: NextConfigInput = {}, options: NextDevtoolsOptions = {}): NextConfigFn {
  const apply = (phase: string, resolved: NextConfigObject): NextConfigObject => {
    if (phase !== PHASE_DEVELOPMENT_SERVER || options.enabled === false || process.env.NEXT_DEVTOOLS === "0") {
      return resolved;
    }

    rememberConfig(resolved);
    const config: NextConfigObject = { ...resolved };
    const root = path.resolve(options.root ?? process.cwd());
    const port = Number(options.port ?? process.env.NEXT_DEVTOOLS_PORT ?? DEFAULT_PORT);
    const token = getOrCreateToken(root);
    const pageExtensions: string[] = config.pageExtensions ?? ["tsx", "ts", "jsx", "js"];
    const [reactMajor] = majorMinorOf(root, "react", [19, 0]);

    // Inlined into the client bundle in dev only — this function never runs for `next build`.
    config.env = {
      ...(config.env || {}),
      NEXT_DEVTOOLS_PORT: String(port),
      NEXT_DEVTOOLS_TOKEN: token,
      NEXT_DEVTOOLS_ROOT: root,
    };

    addWebpackRule(config, root, options.inspector !== false, reactMajor < 18);
    if (options.inspector !== false) addTurbopackRules(config, root, majorMinorOf(root, "next", [16, 0]));

    startDevtoolsServer({ root, port, token, editor: options.editor, pageExtensions });
    return config;
  };

  // Stay synchronous unless the user's own config is async: Next.js before 12.1
  // doesn't accept a Promise from next.config.
  return (phase, ctx) => {
    const resolved = typeof nextConfig === "function" ? nextConfig(phase, ctx) : { ...nextConfig };
    if (resolved && typeof (resolved as Promise<NextConfigObject>).then === "function") {
      return (resolved as Promise<NextConfigObject>).then((c) => apply(phase, c));
    }
    return apply(phase, resolved as NextConfigObject);
  };
}

export default withNextDevtools;
