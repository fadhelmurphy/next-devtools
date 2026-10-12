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

export interface ComponentFile {
  file: string;
  /** Exported component names */
  names: string[];
  directive?: "client" | "server";
  /** Where it renders: client ("use client" / Pages Router), server (App Router default) or shared (depends on importer) */
  runtime: "client" | "server" | "shared";
  role:
    | "component"
    | "page"
    | "pages-special"
    | "layout"
    | "template"
    | "loading"
    | "error"
    | "global-error"
    | "not-found"
    | "forbidden"
    | "unauthorized"
    | "default";
  /** Files that import this one */
  usedBy: string[];
  lines: number;
}

export interface PackageEntry {
  name: string;
  range: string;
  kind: "dependency" | "devDependency";
  installed?: string;
  latest?: string;
  update?: "major" | "minor" | "patch";
  /** npm registry package, or git/file/workspace reference */
  source: "npm" | "external";
}

export interface ConfigSnapshot {
  config: Record<string, unknown>;
  envFiles: { file: string; vars: { key: string; value?: string }[] }[];
}

export interface OpenResult {
  ok: boolean;
  editor?: string;
  reason?: string;
  wsl?: string;
  windowsPath?: string;
}

export interface GitRemote {
  provider: "github" | "gitlab" | "bitbucket" | "other";
  host: string;
  /** owner/repo (or group/subgroup/repo) */
  path: string;
  /** https URL of the repository page */
  web: string;
}

export interface GitCommit {
  sha: string;
  shortSha: string;
  authorName: string;
  authorEmail: string;
  /** ISO date */
  date: string;
  subject: string;
  /** Account on the remote, when known (GitHub API or noreply email) */
  login?: string;
  avatar?: string;
  /** Commit page on the remote */
  url?: string;
  /** Author's profile, or their commits in this repo */
  authorUrl?: string;
  /** Blame of a line that isn't committed yet */
  uncommitted?: boolean;
}

export interface GitInfo {
  available: boolean;
  reason?: string;
  branch?: string;
  remote?: GitRemote;
  /** Working-tree state of the file */
  state?: "clean" | "modified" | "untracked";
  /** Last commit that touched the file */
  file?: GitCommit;
  /** Last commit that changed `lineNumber` */
  line?: GitCommit;
  lineNumber?: number;
  /** The component declared around `lineNumber` (or by name): newest commit across all its lines */
  component?: {
    name?: string;
    start: number;
    end: number;
    commit?: GitCommit;
    /** Lines in the component not committed yet */
    uncommittedLines: number;
    /** Who wrote the current lines, most lines first */
    authors: { name: string; email: string; lines: number }[];
  };
  /** File path relative to the repository root */
  path?: string;
}
