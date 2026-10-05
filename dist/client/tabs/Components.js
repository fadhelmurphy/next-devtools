import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useDevtools, useSettings, FileLink } from "../context.js";
import { buildTree, getFiberFromNode, idOf, isComponentFiber, nodeElements, onCommit, preview, propsOf, sourceOfNode, stateOf, walkTree, } from "../fiber.js";
import { IconChevron, IconInspect, IconRefresh } from "../icons.js";
import { hideHighlight, highlight } from "../overlay.js";
import { updateSettings } from "../settings.js";
const MAX_ROWS = 4000;
export function Components() {
    const { pendingReveal, clearReveal, startPick, picking } = useDevtools();
    const { hideInternals } = useSettings();
    const [tree, setTree] = useState([]);
    const [selected, setSelected] = useState(null);
    const [collapsed, setCollapsed] = useState(() => new Set());
    const [q, setQ] = useState("");
    const [live, setLive] = useState(true);
    const rowRefs = useRef(new Map());
    const refresh = useCallback(() => setTree(buildTree({ hideInternals })), [hideInternals]);
    useEffect(() => {
        refresh();
        if (!live)
            return;
        return onCommit(refresh);
    }, [refresh, live]);
    const index = useMemo(() => {
        const m = new Map();
        walkTree(tree, (node, parents) => m.set(node.id, { node, parents }));
        return m;
    }, [tree]);
    // Reveal a component picked on the page
    useEffect(() => {
        if (!pendingReveal || !tree.length)
            return;
        const fiber = getFiberFromNode(pendingReveal);
        let hit;
        for (let o = fiber?._debugOwner; o && !hit; o = o._debugOwner ?? o.owner)
            hit = index.get(idOf(o));
        for (let f = fiber; f && !hit; f = f.return)
            if (isComponentFiber(f))
                hit = index.get(idOf(f));
        clearReveal();
        if (!hit)
            return;
        const found = hit;
        setSelected(found.node.id);
        setCollapsed((c) => {
            const next = new Set(c);
            found.parents.forEach((p) => next.delete(p.id));
            return next;
        });
        requestAnimationFrame(() => rowRefs.current.get(found.node.id)?.scrollIntoView({ block: "center" }));
    }, [pendingReveal, tree, index, clearReveal]);
    // Flatten for rendering; search keeps matches and their ancestors.
    const { rows, matches } = useMemo(() => {
        const needle = q.trim().toLowerCase();
        const keep = new Set();
        const matchSet = new Set();
        if (needle) {
            walkTree(tree, (n, parents) => {
                if (n.name.toLowerCase().includes(needle)) {
                    matchSet.add(n.id);
                    keep.add(n.id);
                    parents.forEach((p) => keep.add(p.id));
                }
            });
        }
        const out = [];
        const visit = (nodes, depth) => {
            for (const n of nodes) {
                if (out.length >= MAX_ROWS)
                    return;
                if (needle && !keep.has(n.id))
                    continue;
                out.push({ node: n, depth });
                if (n.children.length && (needle || !collapsed.has(n.id)))
                    visit(n.children, depth + 1);
            }
        };
        visit(tree, 0);
        return { rows: out, matches: matchSet };
    }, [tree, collapsed, q]);
    const sel = selected != null ? index.get(selected) : undefined;
    const toggle = (id) => setCollapsed((c) => {
        const next = new Set(c);
        next.has(id) ? next.delete(id) : next.add(id);
        return next;
    });
    const onKeyDown = (e) => {
        if (!rows.length)
            return;
        const i = rows.findIndex((r) => r.node.id === selected);
        const move = (to) => {
            const r = rows[Math.max(0, Math.min(rows.length - 1, to))];
            setSelected(r.node.id);
            rowRefs.current.get(r.node.id)?.scrollIntoView({ block: "nearest" });
        };
        if (e.key === "ArrowDown")
            move(i + 1);
        else if (e.key === "ArrowUp")
            move(i - 1);
        else if (e.key === "ArrowRight" && sel?.node.children.length)
            setCollapsed((c) => (c.delete(sel.node.id), new Set(c)));
        else if (e.key === "ArrowLeft" && sel) {
            if (sel.node.children.length && !collapsed.has(sel.node.id))
                toggle(sel.node.id);
            else if (sel.parents.length)
                move(rows.findIndex((r) => r.node.id === sel.parents[sel.parents.length - 1].id));
        }
        else
            return;
        e.preventDefault();
    };
    return (_jsxs("div", { className: "nd-split", children: [_jsxs("section", { className: "nd-pane", "aria-label": "Component tree", children: [_jsxs("div", { className: "nd-pane-bar", children: [_jsx("input", { className: "nd-input", placeholder: "Find component", value: q, onChange: (e) => setQ(e.target.value), "aria-label": "Find component" }), _jsx("button", { className: "nd-icon-btn", "aria-pressed": picking, onClick: startPick, title: "Pick an element on the page", "aria-label": "Pick an element on the page", style: picking ? { color: "var(--accent-strong)" } : undefined, children: _jsx(IconInspect, {}) }), _jsx("button", { className: "nd-icon-btn", onClick: refresh, title: "Refresh tree", "aria-label": "Refresh tree", children: _jsx(IconRefresh, {}) })] }), _jsxs("div", { className: "nd-pane-bar", style: { paddingTop: 6, paddingBottom: 6 }, children: [_jsxs("label", { className: "nd-check", children: [_jsx("input", { type: "checkbox", checked: !hideInternals, onChange: (e) => updateSettings({ hideInternals: !e.target.checked }) }), "Show Next.js internals"] }), _jsxs("label", { className: "nd-check", children: [_jsx("input", { type: "checkbox", checked: live, onChange: (e) => setLive(e.target.checked) }), "Live"] }), q && _jsxs("span", { className: "nd-faint", style: { marginLeft: "auto" }, children: [matches.size, " found"] })] }), _jsxs("div", { className: "nd-pane-body", role: "tree", tabIndex: 0, onKeyDown: onKeyDown, onMouseLeave: hideHighlight, children: [!tree.length && (_jsxs("div", { className: "nd-empty", style: { padding: "20px 14px" }, children: [_jsx("strong", { children: "No React tree found" }), "The page may still be hydrating. Try refreshing the tree."] })), rows.map(({ node, depth }) => (_jsxs("div", { ref: (el) => {
                                    if (el)
                                        rowRefs.current.set(node.id, el);
                                    else
                                        rowRefs.current.delete(node.id);
                                }, role: "treeitem", "aria-selected": node.id === selected, "aria-expanded": node.children.length ? !collapsed.has(node.id) : undefined, "data-kind": node.kind, className: `nd-tree-row${matches.has(node.id) ? " nd-tree-match" : ""}`, style: { paddingLeft: 8 + depth * 14 }, onClick: () => setSelected(node.id), onDoubleClick: () => node.children.length && toggle(node.id), onMouseEnter: () => highlight(nodeElements(node), { title: node.name, server: node.kind === "server" }), children: [node.children.length ? (_jsx("button", { className: "nd-tree-toggle", "aria-expanded": !collapsed.has(node.id), "aria-label": collapsed.has(node.id) ? "Expand" : "Collapse", onClick: (e) => {
                                            e.stopPropagation();
                                            toggle(node.id);
                                        }, children: _jsx(IconChevron, {}) })) : (_jsx("span", { style: { width: 16, flex: "none" } })), _jsx("span", { className: "nd-tree-name", children: node.name }), node.key != null && _jsxs("span", { className: "nd-tree-key", children: ["key=\"", String(node.key), "\""] }), node.kind === "server" && _jsx("span", { className: "nd-badge nd-badge-server", children: "Server" })] }, node.id))), rows.length >= MAX_ROWS && _jsxs("div", { className: "nd-faint", style: { padding: "8px 14px" }, children: ["Showing the first ", MAX_ROWS, " components. Use search to narrow down."] })] })] }), _jsx("section", { className: "nd-pane", "aria-label": "Component details", children: _jsx("div", { className: "nd-pane-body", children: sel ? _jsx(Details, { item: sel, onSelect: setSelected }) : _jsx(NoSelection, {}) }) })] }));
}
const NoSelection = () => (_jsxs("div", { className: "nd-empty", style: { padding: "20px 16px" }, children: [_jsx("strong", { children: "Select a component" }), "Pick one from the tree, or use the crosshair to click an element on the page."] }));
function Details({ item, onSelect }) {
    const { node, parents } = item;
    const source = sourceOfNode(node);
    const props = propsOf(node);
    const state = stateOf(node);
    const elements = nodeElements(node);
    return (_jsxs("div", { className: "nd-detail", children: [parents.length > 0 && (_jsx("div", { className: "nd-crumbs", style: { marginBottom: 8 }, children: parents.slice(-4).map((p) => (_jsxs("span", { children: [_jsx("button", { onClick: () => onSelect(p.id), children: p.name }), " \u203A"] }, p.id))) })), _jsxs("h3", { children: [node.name, _jsx("span", { className: `nd-badge ${node.kind === "server" ? "nd-badge-server" : "nd-badge-client"}`, children: node.kind === "server" ? `Server${node.env && node.env !== "Server" ? ` (${node.env})` : ""}` : "Client" })] }), _jsxs("div", { style: { marginTop: 6, display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }, children: [source ? _jsx(FileLink, { loc: source }) : _jsx("span", { className: "nd-faint", children: "Source unknown \u2014 it renders no DOM of its own" }), elements.length > 0 && (_jsx("button", { className: "nd-link", onClick: () => elements[0].scrollIntoView({ block: "center", behavior: "smooth" }), children: "Scroll to" }))] }), _jsxs("div", { className: "nd-section", children: [_jsx("h3", { style: { fontFamily: "var(--sans)", fontSize: 12.5, color: "var(--muted)" }, children: "Props" }), Object.keys(props).length ? (_jsx("table", { className: "nd-props", children: _jsx("tbody", { children: Object.entries(props).map(([k, v]) => (_jsxs("tr", { children: [_jsx("td", { children: k }), _jsx("td", { children: preview(v) })] }, k))) }) })) : (_jsx("span", { className: "nd-faint", children: node.kind === "server" && !node.info?.props ? "Not available for this React version" : "None" }))] }), node.kind === "client" && (_jsxs("div", { className: "nd-section", children: [_jsx("h3", { style: { fontFamily: "var(--sans)", fontSize: 12.5, color: "var(--muted)" }, children: "State" }), state.length ? (_jsx("table", { className: "nd-props", children: _jsx("tbody", { children: state.map((v, i) => (_jsxs("tr", { children: [_jsx("td", { children: state.length === 1 && node.fibers[0].tag === 1 ? "this.state" : `state ${i + 1}` }), _jsx("td", { children: preview(v) })] }, i))) }) })) : (_jsx("span", { className: "nd-faint", children: "Stateless" }))] })), _jsxs("div", { className: "nd-section", children: [_jsx("h3", { style: { fontFamily: "var(--sans)", fontSize: 12.5, color: "var(--muted)" }, children: "Renders" }), _jsxs("span", { className: "nd-muted", children: [elements.length, " DOM ", elements.length === 1 ? "element" : "elements", node.children.length ? `, ${node.children.length} child ${node.children.length === 1 ? "component" : "components"}` : ""] })] })] }));
}
