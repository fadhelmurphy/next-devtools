import fs from "node:fs";
import https from "node:https";
import path from "node:path";
import { createRequire } from "node:module";
import type { PackageEntry } from "../shared/types";

const latestCache = new Map<string, { version: string | null; at: number }>();
const TTL = 30 * 60 * 1000;

function readJson(file: string): any {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch {
    return undefined;
  }
}

function installedVersion(root: string, name: string): string | undefined {
  const direct = readJson(path.join(root, "node_modules", name, "package.json"))?.version;
  if (direct) return direct;
  try {
    return readJson(createRequire(path.join(root, "package.json")).resolve(`${name}/package.json`))?.version;
  } catch {
    return undefined;
  }
}

const parse = (v?: string | null) => (v ?? "").replace(/^[^\d]*/, "").split(/[.+-]/).slice(0, 3).map((n) => Number(n) || 0);

export function updateType(installed?: string, latest?: string | null): PackageEntry["update"] {
  if (!installed || !latest) return undefined;
  const [a, b, c] = parse(installed);
  const [x, y, z] = parse(latest);
  if (x > a) return "major";
  if (x === a && y > b) return "minor";
  if (x === a && y === b && z > c) return "patch";
  return undefined;
}

/** GET a JSON document with a 5s timeout. Uses fetch when present (honours proxies on newer Node), https otherwise (Node < 18). */
function getJson(url: string): Promise<any> {
  if (typeof fetch === "function" && typeof AbortController === "function") {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 5000);
    return fetch(url, { signal: ctrl.signal, headers: { accept: "application/json" } })
      .then((r) => (r.ok ? r.json() : null))
      .finally(() => clearTimeout(t));
  }
  return new Promise((resolve, reject) => {
    const req = https.get(url, { headers: { accept: "application/json" }, timeout: 5000 }, (res) => {
      if (res.statusCode !== 200) {
        res.resume();
        return resolve(null);
      }
      let data = "";
      res.setEncoding("utf8");
      res.on("data", (c) => (data += c));
      res.on("end", () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    });
    req.on("timeout", () => req.destroy(new Error("timeout")));
    req.on("error", reject);
  });
}

async function fetchLatest(name: string): Promise<string | null> {
  const hit = latestCache.get(name);
  if (hit && Date.now() - hit.at < TTL) return hit.version;
  let version: string | null = null;
  try {
    const body = await getJson(`https://registry.npmjs.org/${name.replace("/", "%2F")}/latest`);
    version = body?.version ?? null;
  } catch {
    version = null; // offline or blocked: just don't show update info
  }
  latestCache.set(name, { version, at: Date.now() });
  return version;
}

export async function listPackages(root: string, withLatest: boolean): Promise<PackageEntry[]> {
  const pkg = readJson(path.join(root, "package.json")) ?? {};
  const entries: PackageEntry[] = [];
  for (const [kind, deps] of [["dependency", pkg.dependencies], ["devDependency", pkg.devDependencies]] as const) {
    for (const [name, range] of Object.entries<string>(deps ?? {})) {
      const local = /^(file|link|workspace|github|git\+|https?):/.test(range) || range.includes("/");
      entries.push({ name, range, kind, installed: installedVersion(root, name), source: local ? "external" : "npm" });
    }
  }
  if (withLatest) {
    const queue = entries.filter((e) => e.source === "npm");
    let i = 0;
    await Promise.all(
      Array.from({ length: 8 }, async () => {
        while (i < queue.length) {
          const e = queue[i++];
          e.latest = (await fetchLatest(e.name)) ?? undefined;
          e.update = updateType(e.installed, e.latest);
        }
      }),
    );
  }
  return entries.sort((a, b) => (a.kind === b.kind ? a.name.localeCompare(b.name) : a.kind === "dependency" ? -1 : 1));
}
