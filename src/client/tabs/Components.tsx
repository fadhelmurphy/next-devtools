import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useDevtools, useSettings, FileLink } from "../context.js";
import {
  buildTree,
  getFiberFromNode,
  idOf,
  isComponentFiber,
  nodeElements,
  onCommit,
  ownerOfElement,
  preview,
  propsOf,
  sourceOfNode,
  stateOf,
  walkTree,
  type TreeNode,
} from "../fiber.js";
import { IconChevron, IconInspect, IconOpen, IconRefresh } from "../icons.js";
import { ProjectComponents } from "./ProjectComponents.js";
import { hideHighlight, highlight } from "../overlay.js";
import { updateSettings } from "../settings.js";

interface Indexed {
  node: TreeNode;
  parents: TreeNode[];
}

const MAX_ROWS = 4000;

function RuntimeTree({ mode }: { mode: React.ReactNode }) {
  const { pendingReveal, clearReveal, startPick, picking, open, toast } = useDevtools();
  const { hideInternals } = useSettings();
  const [tree, setTree] = useState<TreeNode[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [collapsed, setCollapsed] = useState<Set<number>>(() => new Set());
  const [q, setQ] = useState("");
  const [live, setLive] = useState(true);
  const rowRefs = useRef(new Map<number, HTMLElement>());

  const refresh = useCallback(() => setTree(buildTree({ hideInternals })), [hideInternals]);
  useEffect(() => {
    refresh();
    if (!live) return;
    return onCommit(refresh);
  }, [refresh, live]);

  const index = useMemo(() => {
    const m = new Map<number, Indexed>();
    walkTree(tree, (node, parents) => m.set(node.id, { node, parents }));
    return m;
  }, [tree]);

  // Reveal a component picked on the page
  useEffect(() => {
    if (!pendingReveal || !tree.length) return;
    const fiber = getFiberFromNode(pendingReveal);
    // Same owner the inspector tooltip names, then anything indexed up the tree.
    const owner = ownerOfElement(pendingReveal)?.owner;
    let hit: Indexed | undefined = owner ? index.get(idOf(owner)) : undefined;
    for (let o = fiber?._debugOwner; o && !hit; o = o._debugOwner ?? o.owner) hit = index.get(idOf(o));
    for (let f = fiber; f && !hit; f = f.return) {
      if (isComponentFiber(f)) hit = index.get(idOf(f));
      const infos = f._debugInfo;
      if (!hit && Array.isArray(infos)) for (let i = infos.length - 1; i >= 0 && !hit; i--) if (infos[i]) hit = index.get(idOf(infos[i]));
    }
    clearReveal();
    if (!hit) {
      toast("Rendered by a Server Component. Server Components show in the tree from React 19 (Next.js 14.2+); the inspector still opens its source.");
      return;
    }
    const found = hit;
    setSelected(found.node.id);
    setCollapsed((c) => {
      const next = new Set(c);
      found.parents.forEach((p) => next.delete(p.id));
      return next;
    });
    requestAnimationFrame(() => rowRefs.current.get(found.node.id)?.scrollIntoView({ block: "center" }));
  }, [pendingReveal, tree, index, clearReveal, toast]);

  // Flatten for rendering; search keeps matches and their ancestors.
  const { rows, matches } = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const keep = new Set<number>();
    const matchSet = new Set<number>();
    if (needle) {
      walkTree(tree, (n, parents) => {
        if (n.name.toLowerCase().includes(needle)) {
          matchSet.add(n.id);
          keep.add(n.id);
          parents.forEach((p) => keep.add(p.id));
        }
      });
    }
    const out: { node: TreeNode; depth: number }[] = [];
    const visit = (nodes: TreeNode[], depth: number) => {
      for (const n of nodes) {
        if (out.length >= MAX_ROWS) return;
        if (needle && !keep.has(n.id)) continue;
        out.push({ node: n, depth });
        if (n.children.length && (needle || !collapsed.has(n.id))) visit(n.children, depth + 1);
      }
    };
    visit(tree, 0);
    return { rows: out, matches: matchSet };
  }, [tree, collapsed, q]);

  const sel = selected != null ? index.get(selected) : undefined;

  const toggle = (id: number) =>
    setCollapsed((c) => {
      const next = new Set(c);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (!rows.length) return;
    const i = rows.findIndex((r) => r.node.id === selected);
    const move = (to: number) => {
      const r = rows[Math.max(0, Math.min(rows.length - 1, to))];
      setSelected(r.node.id);
      rowRefs.current.get(r.node.id)?.scrollIntoView({ block: "nearest" });
    };
    if (e.key === "ArrowDown") move(i + 1);
    else if (e.key === "ArrowUp") move(i - 1);
    else if (e.key === "ArrowRight" && sel?.node.children.length) setCollapsed((c) => (c.delete(sel.node.id), new Set(c)));
    else if (e.key === "ArrowLeft" && sel) {
      if (sel.node.children.length && !collapsed.has(sel.node.id)) toggle(sel.node.id);
      else if (sel.parents.length) move(rows.findIndex((r) => r.node.id === sel.parents[sel.parents.length - 1].id));
    } else return;
    e.preventDefault();
  };

  return (
    <div className="nd-split">
      <section className="nd-pane" aria-label="Component tree">
        <div className="nd-pane-bar">{mode}</div>
        <div className="nd-pane-bar">
          <input className="nd-input" placeholder="Find component" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Find component" />
          <button
            className="nd-icon-btn"
            aria-pressed={picking}
            onClick={startPick}
            title="Pick an element on the page"
            aria-label="Pick an element on the page"
            style={picking ? { color: "var(--accent-strong)" } : undefined}
          >
            <IconInspect />
          </button>
          <button className="nd-icon-btn" onClick={refresh} title="Refresh tree" aria-label="Refresh tree">
            <IconRefresh />
          </button>
        </div>
        <div className="nd-pane-bar" style={{ paddingTop: 6, paddingBottom: 6 }}>
          <label className="nd-check">
            <input type="checkbox" checked={!hideInternals} onChange={(e) => updateSettings({ hideInternals: !e.target.checked })} />
            Show Next.js internals
          </label>
          <label className="nd-check">
            <input type="checkbox" checked={live} onChange={(e) => setLive(e.target.checked)} />
            Live
          </label>
          {q && <span className="nd-faint" style={{ marginLeft: "auto" }}>{matches.size} found</span>}
        </div>
        <div className="nd-pane-body" role="tree" tabIndex={0} onKeyDown={onKeyDown} onMouseLeave={hideHighlight}>
          {!tree.length && (
            <div className="nd-empty" style={{ padding: "20px 14px" }}>
              <strong>No React tree found</strong>
              The page may still be hydrating. Try refreshing the tree.
            </div>
          )}
          {rows.map(({ node, depth }) => (
            <div
              key={node.id}
              ref={(el) => {
                if (el) rowRefs.current.set(node.id, el);
                else rowRefs.current.delete(node.id);
              }}
              role="treeitem"
              aria-selected={node.id === selected}
              aria-expanded={node.children.length ? !collapsed.has(node.id) : undefined}
              data-kind={node.kind}
              className={`nd-tree-row${matches.has(node.id) ? " nd-tree-match" : ""}`}
              style={{ paddingLeft: 8 + depth * 14 }}
              onClick={() => setSelected(node.id)}
              onDoubleClick={() => open(sourceOfNode(node))}
              title="Double-click to open in editor"
              onMouseEnter={() => highlight(nodeElements(node), { title: node.name, server: node.kind === "server" })}
            >
              {node.children.length ? (
                <button
                  className="nd-tree-toggle"
                  aria-expanded={!collapsed.has(node.id)}
                  aria-label={collapsed.has(node.id) ? "Expand" : "Collapse"}
                  onClick={(e) => {
                    e.stopPropagation();
                    toggle(node.id);
                  }}
                >
                  <IconChevron />
                </button>
              ) : (
                <span style={{ width: 16, flex: "none" }} />
              )}
              <span className="nd-tree-name">{node.name}</span>
              {node.key != null && <span className="nd-tree-key">key="{String(node.key)}"</span>}
              {node.kind === "server" && <span className="nd-badge nd-badge-server">Server</span>}
              <button
                className="nd-row-action"
                aria-label={`Open ${node.name} in editor`}
                title="Open in editor"
                onClick={(e) => {
                  e.stopPropagation();
                  open(sourceOfNode(node));
                }}
              >
                <IconOpen />
              </button>
            </div>
          ))}
          {rows.length >= MAX_ROWS && <div className="nd-faint" style={{ padding: "8px 14px" }}>Showing the first {MAX_ROWS} components. Use search to narrow down.</div>}
        </div>
      </section>

      <section className="nd-pane" aria-label="Component details">
        <div className="nd-pane-body">{sel ? <Details item={sel} onSelect={setSelected} /> : <NoSelection />}</div>
      </section>
    </div>
  );
}

const NoSelection = () => (
  <div className="nd-empty" style={{ padding: "20px 16px" }}>
    <strong>Select a component</strong>
    Pick one from the tree, or use the crosshair to click an element on the page.
  </div>
);

function Details({ item, onSelect }: { item: Indexed; onSelect: (id: number) => void }) {
  const { open } = useDevtools();
  const { node, parents } = item;
  const source = sourceOfNode(node);
  const props = propsOf(node);
  const state = stateOf(node);
  const elements = nodeElements(node);

  return (
    <div className="nd-detail">
      {parents.length > 0 && (
        <div className="nd-crumbs" style={{ marginBottom: 8 }}>
          {parents.slice(-4).map((p) => (
            <span key={p.id}>
              <button onClick={() => onSelect(p.id)}>{p.name}</button> ›
            </span>
          ))}
        </div>
      )}
      <h3>
        {node.name}
        <span className={`nd-badge ${node.kind === "server" ? "nd-badge-server" : "nd-badge-client"}`}>
          {node.kind === "server" ? `Server${node.env && node.env !== "Server" ? ` (${node.env})` : ""}` : "Client"}
        </span>
      </h3>
      <div style={{ marginTop: 6, display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
        {source ? (
          <>
            <button className="nd-btn nd-btn-primary" onClick={() => open(source)}>
              <IconOpen /> Open in editor
            </button>
            <FileLink loc={source} />
          </>
        ) : (
          <span className="nd-faint">Source unknown — it renders no DOM of its own</span>
        )}
        {elements.length > 0 && (
          <button className="nd-link" onClick={() => elements[0].scrollIntoView({ block: "center", behavior: "smooth" })}>
            Scroll to
          </button>
        )}
      </div>

      <div className="nd-section">
        <h3 style={{ fontFamily: "var(--sans)", fontSize: 12.5, color: "var(--muted)" }}>Props</h3>
        {Object.keys(props).length ? (
          <table className="nd-props">
            <tbody>
              {Object.entries(props).map(([k, v]) => (
                <tr key={k}>
                  <td>{k}</td>
                  <td>{preview(v)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <span className="nd-faint">{node.kind === "server" && !node.info?.props ? "Not available for this React version" : "None"}</span>
        )}
      </div>

      {node.kind === "client" && (
        <div className="nd-section">
          <h3 style={{ fontFamily: "var(--sans)", fontSize: 12.5, color: "var(--muted)" }}>State</h3>
          {state.length ? (
            <table className="nd-props">
              <tbody>
                {state.map((v, i) => (
                  <tr key={i}>
                    <td>{state.length === 1 && node.fibers[0].tag === 1 ? "this.state" : `state ${i + 1}`}</td>
                    <td>{preview(v)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <span className="nd-faint">Stateless</span>
          )}
        </div>
      )}

      <div className="nd-section">
        <h3 style={{ fontFamily: "var(--sans)", fontSize: 12.5, color: "var(--muted)" }}>Renders</h3>
        <span className="nd-muted">
          {elements.length} DOM {elements.length === 1 ? "element" : "elements"}
          {node.children.length ? `, ${node.children.length} child ${node.children.length === 1 ? "component" : "components"}` : ""}
        </span>
      </div>
    </div>
  );
}

export function Components() {
  const [mode, setMode] = useState<"page" | "project">("page");
  const switcher = (
    <div className="nd-seg" role="group" aria-label="Components view">
      <button aria-pressed={mode === "page"} onClick={() => setMode("page")}>On this page</button>
      <button aria-pressed={mode === "project"} onClick={() => setMode("project")}>All in project</button>
    </div>
  );
  return mode === "page" ? <RuntimeTree mode={switcher} /> : <ProjectComponents mode={switcher} />;
}
