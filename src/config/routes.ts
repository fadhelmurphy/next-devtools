import fs from "node:fs";
import path from "node:path";
import type { RouteEntry } from "../shared/types";

const toPosix = (p: string) => p.split(path.sep).join("/");

function readDir(dir: string): fs.Dirent[] {
  try {
    return fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return [];
  }
}

function paramInfo(segments: string[]) {
  const params: string[] = [];
  let catchAll = false;
  let optionalCatchAll = false;
  for (const seg of segments) {
    let m: RegExpMatchArray | null;
    if ((m = seg.match(/^\[\[\.\.\.(.+)\]\]$/))) {
      params.push(m[1]);
      optionalCatchAll = true;
    } else if ((m = seg.match(/^\[\.\.\.(.+)\]$/))) {
      params.push(m[1]);
      catchAll = true;
    } else if ((m = seg.match(/^\[(.+)\]$/))) {
      params.push(m[1]);
    }
  }
  return { params, catchAll, optionalCatchAll };
}

export function resolveRouterDirs(root: string) {
  const pick = (name: string) => {
    for (const candidate of [path.join(root, name), path.join(root, "src", name)]) {
      try {
        if (fs.statSync(candidate).isDirectory()) return candidate;
      } catch {}
    }
    return undefined;
  };
  return { appDir: pick("app"), pagesDir: pick("pages") };
}

/** App Router: every `page.*` and `route.*` file under `app/`. */
export function scanAppRouter(root: string, appDir: string, exts: string[]): RouteEntry[] {
  const routes: RouteEntry[] = [];
  const extRe = new RegExp(`^(page|route|layout)\\.(${exts.map((e) => e.replace(/\./g, "\\.")).join("|")})$`);

  const walk = (dir: string, segments: string[], layouts: string[]) => {
    const entries = readDir(dir);
    const here = [...layouts];
    const layout = entries.find((e) => e.isFile() && extRe.exec(e.name)?.[1] === "layout");
    if (layout) here.push(toPosix(path.relative(root, path.join(dir, layout.name))));

    for (const e of entries) {
      if (!e.isFile()) continue;
      const kind = extRe.exec(e.name)?.[1];
      if (kind !== "page" && kind !== "route") continue;

      let slot: string | undefined;
      let intercepting = false;
      const urlSegments: string[] = [];
      for (const seg of segments) {
        if (seg.startsWith("@")) {
          slot = seg;
          continue;
        }
        const ic = seg.match(/^(\(\.{1,3}\)|\(\.\.\)(\(\.\.\))+)(.+)$/);
        if (ic) {
          intercepting = true;
          urlSegments.push(ic[3]);
          continue;
        }
        if (/^\(.+\)$/.test(seg)) continue; // route group
        urlSegments.push(seg);
      }
      const info = paramInfo(urlSegments);
      routes.push({
        route: "/" + urlSegments.join("/"),
        file: toPosix(path.relative(root, path.join(dir, e.name))),
        router: "app",
        kind: kind === "route" ? "api" : "page",
        ...info,
        ...(slot ? { slot } : {}),
        ...(intercepting ? { intercepting } : {}),
        layouts: kind === "page" ? here : undefined,
      });
    }

    for (const e of entries) {
      if (!e.isDirectory()) continue;
      if (e.name.startsWith("_") || e.name === "node_modules") continue; // private folders
      walk(path.join(dir, e.name), [...segments, e.name], here);
    }
  };

  walk(appDir, [], []);
  return routes;
}

/** Pages Router: every page file under `pages/`, `pages/api/**` as API routes. */
export function scanPagesRouter(root: string, pagesDir: string, exts: string[]): RouteEntry[] {
  const routes: RouteEntry[] = [];
  const extRe = new RegExp(`\\.(${exts.map((e) => e.replace(/\./g, "\\.")).join("|")})$`);

  const walk = (dir: string, segments: string[]) => {
    for (const e of readDir(dir)) {
      const full = path.join(dir, e.name);
      if (e.isDirectory()) {
        if (e.name === "node_modules") continue;
        walk(full, [...segments, e.name]);
        continue;
      }
      if (!e.isFile() || !extRe.test(e.name)) continue;
      const base = e.name.replace(extRe, "");
      if (segments.length === 0 && base.startsWith("_")) continue; // _app, _document, _error
      if (/\.(test|spec)$/.test(base) || base.endsWith(".d")) continue;

      const urlSegments = base === "index" ? segments : [...segments, base];
      const info = paramInfo(urlSegments);
      routes.push({
        route: "/" + urlSegments.join("/"),
        file: toPosix(path.relative(root, full)),
        router: "pages",
        kind: segments[0] === "api" ? "api" : "page",
        ...info,
      });
    }
  };

  walk(pagesDir, []);
  return routes;
}

export function scanRoutes(root: string, pageExtensions: string[]): RouteEntry[] {
  const { appDir, pagesDir } = resolveRouterDirs(root);
  const routes = [
    ...(appDir ? scanAppRouter(root, appDir, pageExtensions) : []),
    ...(pagesDir ? scanPagesRouter(root, pagesDir, pageExtensions) : []),
  ];
  // Static before dynamic, then alphabetical — mirrors how Next matches.
  const weight = (r: RouteEntry) => (r.optionalCatchAll ? 3 : r.catchAll ? 2 : r.params.length ? 1 : 0);
  return routes.sort(
    (a, b) =>
      (a.kind === b.kind ? 0 : a.kind === "page" ? -1 : 1) ||
      a.route.localeCompare(b.route) ||
      weight(a) - weight(b),
  );
}
