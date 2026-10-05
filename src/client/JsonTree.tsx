import { useState } from "react";
import { IconChevron } from "./icons.js";

/** Collapsible JSON viewer for config, payloads and response bodies. */
export function JsonTree({ value, name, depth = 0, open = 1 }: { value: unknown; name?: string; depth?: number; open?: number }) {
  const isObj = value !== null && typeof value === "object";
  const [expanded, setExpanded] = useState(depth < open);
  const label = name !== undefined ? <span className="nd-json-key">{name}</span> : null;

  if (!isObj) {
    return (
      <div className="nd-json-row" style={{ paddingLeft: depth * 14 + 16 }}>
        {label}
        {label && <span className="nd-faint">: </span>}
        <JsonValue value={value} />
      </div>
    );
  }
  const entries = Array.isArray(value) ? value.map((v, i) => [String(i), v] as const) : Object.entries(value as object);
  const summary = Array.isArray(value) ? `Array(${entries.length})` : entries.length ? `{${entries.length}}` : "{}";
  return (
    <>
      <div className="nd-json-row" style={{ paddingLeft: depth * 14 }}>
        <button className="nd-tree-toggle" aria-expanded={expanded} onClick={() => setExpanded(!expanded)} disabled={!entries.length}>
          {entries.length ? <IconChevron /> : null}
        </button>
        {label}
        {label && <span className="nd-faint">: </span>}
        <span className="nd-faint">{summary}</span>
      </div>
      {expanded && entries.slice(0, 500).map(([k, v]) => <JsonTree key={k} name={k} value={v} depth={depth + 1} open={open} />)}
      {expanded && entries.length > 500 && (
        <div className="nd-json-row nd-faint" style={{ paddingLeft: (depth + 1) * 14 + 16 }}>
          …{entries.length - 500} more
        </div>
      )}
    </>
  );
}

function JsonValue({ value }: { value: unknown }) {
  if (typeof value === "string") {
    const fn = value.startsWith("ƒ ");
    const shown = value.length > 300 ? value.slice(0, 300) + "…" : value;
    return <span className={fn ? "nd-json-fn" : "nd-json-str"}>{fn ? shown : JSON.stringify(shown)}</span>;
  }
  if (typeof value === "number" || typeof value === "bigint") return <span className="nd-json-num">{String(value)}</span>;
  if (typeof value === "boolean") return <span className="nd-json-bool">{String(value)}</span>;
  return <span className="nd-faint">{String(value)}</span>;
}
