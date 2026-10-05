import path from "node:path";
import { createRequire } from "node:module";
import type { ConfigSnapshot } from "../shared/types";

let resolvedConfig: Record<string, unknown> = {};
const HIDDEN_ENV = /^NEXT_DEVTOOLS_/;

/** Called by withNextDevtools with the user's config (before our additions). */
export function rememberConfig(config: Record<string, unknown>) {
  resolvedConfig = config;
}

export function serialize(value: unknown, depth = 0, seen = new WeakSet<object>()): unknown {
  if (value === undefined) return "undefined";
  if (value === null || typeof value !== "object") {
    if (typeof value === "function") return `ƒ ${value.name || "anonymous"}()`;
    if (typeof value === "bigint" || typeof value === "symbol") return String(value);
    return value;
  }
  if (value instanceof RegExp) return value.toString();
  if (seen.has(value)) return "[Circular]";
  seen.add(value);
  if (depth > 8) return Array.isArray(value) ? `Array(${value.length})` : "{…}";
  if (Array.isArray(value)) return value.map((v) => serialize(v, depth + 1, seen));
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(value)) out[k] = serialize(v, depth + 1, seen);
  return out;
}

function parseDotenv(src: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const line of src.split(/\r?\n/)) {
    const m = line.match(/^\s*(?:export\s+)?([\w.-]+)\s*=\s*(.*)$/);
    if (m) out[m[1]] = m[2].replace(/^(['"])(.*)\1$/, "$2");
  }
  return out;
}

export function getConfigSnapshot(root: string): ConfigSnapshot {
  const config = serialize(resolvedConfig) as Record<string, unknown>;
  if (config.env && typeof config.env === "object") {
    for (const k of Object.keys(config.env)) if (HIDDEN_ENV.test(k)) delete (config.env as any)[k];
  }

  const envFiles: ConfigSnapshot["envFiles"] = [];
  try {
    const { loadEnvConfig } = createRequire(path.join(root, "package.json"))("@next/env");
    const { loadedEnvFiles } = loadEnvConfig(root, true, { info() {}, error() {} }, true);
    for (const f of loadedEnvFiles ?? []) {
      envFiles.push({
        file: f.path,
        // Only NEXT_PUBLIC_* values are shown — they're in the client bundle anyway.
        vars: Object.entries<string>(f.env ?? parseDotenv(f.contents ?? "")).map(([key, value]) => ({
          key,
          value: key.startsWith("NEXT_PUBLIC_") ? value : undefined,
        })),
      });
    }
  } catch {}

  return { config, envFiles };
}
