type NextConfigObject = Record<string, any>;
type NextConfigFn = (phase: string, ctx: {
    defaultConfig: NextConfigObject;
}) => NextConfigObject | Promise<NextConfigObject>;
type NextConfigInput = NextConfigObject | NextConfigFn;
interface NextDevtoolsOptions {
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
declare function withNextDevtools(nextConfig?: NextConfigInput, options?: NextDevtoolsOptions): NextConfigFn;

interface RouteEntry {
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
interface AssetEntry {
    /** Public URL path, e.g. `/images/logo.png` */
    path: string;
    /** Relative to project root */
    file: string;
    size: number;
    type: "image" | "video" | "audio" | "font" | "text" | "other";
    mtime: number;
}
interface ProjectInfo {
    root: string;
    name?: string;
    version?: string;
    versions: {
        next?: string;
        react?: string;
        reactDom?: string;
        node: string;
        typescript?: string;
    };
    bundler: "turbopack" | "webpack";
    router: {
        app: boolean;
        pages: boolean;
        appDir?: string;
        pagesDir?: string;
    };
    middleware?: string;
    instrumentation?: string;
    srcDir: boolean;
    configFile?: string;
    publicEnv: Record<string, string>;
    dependencies: Record<string, string>;
    devDependencies: Record<string, string>;
    pageExtensions: string[];
}

export { type AssetEntry, type NextConfigInput, type NextDevtoolsOptions, type ProjectInfo, type RouteEntry, withNextDevtools as default, withNextDevtools };
