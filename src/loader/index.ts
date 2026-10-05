import path from "node:path";
import { injectSourceAttributes } from "./transform";

interface LoaderOptions {
  root?: string;
}

interface LoaderContext {
  resourcePath: string;
  rootContext?: string;
  sourceMap?: boolean;
  query?: unknown;
  getOptions?: () => LoaderOptions;
  cacheable?: (flag?: boolean) => void;
  callback: (err: Error | null, content?: string, map?: unknown) => void;
}

/**
 * webpack / Turbopack loader. Runs before SWC (`enforce: "pre"` on webpack)
 * and tags host JSX elements with their source location. Dev-only — the
 * config wrapper never registers it for production builds.
 */
function nextDevtoolsLoader(this: LoaderContext, source: string, inputMap?: unknown) {
  this.cacheable?.(true);
  const file = this.resourcePath;
  if (!file || /[\\/]node_modules[\\/]/.test(file) || /[\\/]\.next[\\/]/.test(file)) {
    return this.callback(null, source, inputMap);
  }

  let options: LoaderOptions = {};
  try {
    options = this.getOptions?.() ?? (typeof this.query === "object" && this.query ? (this.query as LoaderOptions) : {});
  } catch {
    options = {};
  }
  const root = options.root || this.rootContext || process.cwd();
  const relativePath = path.relative(root, file).split(path.sep).join("/");

  try {
    const result = injectSourceAttributes(source, {
      relativePath,
      sourceMap: this.sourceMap !== false && !inputMap,
    });
    if (!result.count) return this.callback(null, source, inputMap);
    return this.callback(null, result.code, result.map ?? inputMap);
  } catch {
    // Never break the user's build because of a dev nicety.
    return this.callback(null, source, inputMap);
  }
}

export default nextDevtoolsLoader;
