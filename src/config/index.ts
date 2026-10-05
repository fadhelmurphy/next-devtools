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

function nextMajorMinor(root: string): [number, number] {
  try {
    const v: string = createRequire(path.join(root, "package.json"))("next/package.json").version;
    const [maj, min] = v.split(".").map(Number);
    return [maj || 0, min || 0];
  } catch {
    return [16, 0];
  }
}

function addWebpackRule(config: NextConfigObject, root: string) {
  const userWebpack = config.webpack;
  config.webpack = (webpackConfig: any, ctx: any) => {
    const result = typeof userWebpack === "function" ? userWebpack(webpackConfig, ctx) : webpackConfig;
    if (ctx?.dev) {
      result.module = result.module || {};
      result.module.rules = result.module.rules || [];
      result.module.rules.unshift({
        test: /\.(jsx|tsx|js|mjs)$/,
        exclude: /[\\/]node_modules[\\/]/,
        enforce: "pre",
        use: [{ loader: LOADER_PATH, options: { root } }],
      });
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

  // Next 14.x / 15.x: single rule per glob, no conditions. The loader itself bails on node_modules.
  const target =
    major > 15 || (major === 15 && minor >= 3)
      ? (config.turbopack = config.turbopack || {})
      : ((config.experimental = config.experimental || {}), (config.experimental.turbo = config.experimental.turbo || {}));
  const rules = (target.rules = target.rules || {});
  for (const glob of ["*.tsx", "*.jsx"]) {
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
  return async (phase, ctx) => {
    const resolved: NextConfigObject =
      typeof nextConfig === "function" ? await nextConfig(phase, ctx) : { ...nextConfig };

    if (phase !== PHASE_DEVELOPMENT_SERVER || options.enabled === false || process.env.NEXT_DEVTOOLS === "0") {
      return resolved;
    }

    rememberConfig(resolved);
    const config: NextConfigObject = { ...resolved };
    const root = path.resolve(options.root ?? process.cwd());
    const port = Number(options.port ?? process.env.NEXT_DEVTOOLS_PORT ?? DEFAULT_PORT);
    const token = getOrCreateToken(root);
    const pageExtensions: string[] = config.pageExtensions ?? ["tsx", "ts", "jsx", "js"];

    // Inlined into the client bundle in dev only — this function never runs for `next build`.
    config.env = {
      ...(config.env || {}),
      NEXT_DEVTOOLS_PORT: String(port),
      NEXT_DEVTOOLS_TOKEN: token,
      NEXT_DEVTOOLS_ROOT: root,
    };

    if (options.inspector !== false) {
      addWebpackRule(config, root);
      addTurbopackRules(config, root, nextMajorMinor(root));
    }

    startDevtoolsServer({ root, port, token, editor: options.editor, pageExtensions });
    return config;
  };
}

export default withNextDevtools;
