/** Attribute injected on every host JSX element in dev: `relative/path.tsx:line:column`. */
export const SOURCE_ATTR = "data-nd-src";

/** Header the browser panel sends so random websites can't drive the local API. */
export const TOKEN_HEADER = "x-next-devtools-token";

export interface RouteEntry {
  /** URL pattern, e.g. `/blog/[slug]` */
  route: string;
  /** File path relative to the project root */
  file: string;
  router: "app" | "pages";
  kind: "page" | "api";
  /** Dynamic param names in order, e.g. ["slug"] */
  params: string[];
  /** `[...x]` / `[[...x]]` */
  catchAll: boolean;
  optionalCatchAll: boolean;
  /** App Router: parallel route slot (`@modal`) or intercepting route (`(.)photo`) */
  slot?: string;
  intercepting?: boolean;
  /** App Router: layout files wrapping this page, outermost first */
  layouts?: string[];
}

export interface AssetEntry {
  /** Public URL path, e.g. `/images/logo.png` */
  path: string;
  /** Relative to project root */
  file: string;
  size: number;
  type: "image" | "video" | "audio" | "font" | "text" | "other";
  mtime: number;
}

export interface ProjectInfo {
  root: string;
  name?: string;
  version?: string;
  versions: { next?: string; react?: string; reactDom?: string; node: string; typescript?: string };
  bundler: "turbopack" | "webpack";
  router: { app: boolean; pages: boolean; appDir?: string; pagesDir?: string };
  middleware?: string;
  instrumentation?: string;
  srcDir: boolean;
  configFile?: string;
  publicEnv: Record<string, string>;
  dependencies: Record<string, string>;
  devDependencies: Record<string, string>;
  pageExtensions: string[];
}
