/* Reading React's internal fiber tree. Dev-only and deliberately defensive:
   these are private fields, so every access tolerates them being absent. */
import { SOURCE_ATTR } from "../shared/types.js";
import { parseSource } from "./api.js";
export const HOST_ID = "next-devtools-host";
const FunctionComponent = 0;
const ClassComponent = 1;
const HostComponent = 5;
const HostHoistable = 26;
const HostSingleton = 27; // <html>, <head>, <body> in React 19
const isHostFiber = (f) => f && (f.tag === HostComponent || f.tag === HostHoistable || f.tag === HostSingleton);
const ForwardRef = 11;
const SimpleMemoComponent = 15;
const COMPONENT_TAGS = new Set([FunctionComponent, ClassComponent, ForwardRef, SimpleMemoComponent]);
/** Components Next.js renders around your code. Hidden unless "Show Next.js internals" is on. */
const INTERNAL = new Set([
    "AppRouter", "Router", "ServerRoot", "Root", "HotReload", "ReactDevOverlay", "DevRootHTTPAccessFallbackBoundary",
    "AppDevOverlay", "AppDevOverlayErrorBoundary", "RuntimeStylesForWebpack", "DevOverlay", "ReplaySsrOnlyErrors", "HistoryUpdater", "RuntimeStyles",
    "ErrorBoundary", "ErrorBoundaryHandler", "GlobalError", "DefaultGlobalError", "AppRouterAnnouncer",
    "RedirectBoundary", "RedirectErrorBoundary", "NotFoundBoundary", "NotFoundErrorBoundary",
    "HTTPAccessFallbackBoundary", "HTTPAccessFallbackErrorBoundary", "LoadingBoundary", "LayoutRouter",
    "OuterLayoutRouter", "InnerLayoutRouter", "RenderFromTemplateContext", "ScrollAndFocusHandler",
    "InnerScrollAndFocusHandler", "ClientPageRoot", "ClientSegmentRoot", "MetadataBoundary", "ViewportBoundary",
    "OutletBoundary", "MetadataWrapper", "AsyncMetadata", "AsyncMetadataOutlet", "MetadataOutlet", "ViewportTree",
    "MetadataTree", "MetadataResolver", "NonIndex", "StreamingMetadataOutlet", "StreamingMetadataOutletImpl",
    "IconMark", "SegmentViewNode", "SegmentStateProvider", "SegmentBoundaryTriggerNode", "SegmentViewStateNode",
    "AppContainer", "PathnameContextProviderAdapter", "Container", "Head", "RouteAnnouncer", "PagesDevOverlay",
    "PagesDevOverlayErrorBoundary", "PagesDevOverlayBridge", "ReactDevOverlayImpl", "NextDevtools",
    "__next_root_layout_boundary__", "__next_metadata_boundary__", "__next_viewport_boundary__",
    "__next_outlet_boundary__", "RootLayoutBoundary", "RenderValidationBoundaryAtThisLevel",
    // Next 16
    "RootErrorBoundary", "ViewportWrapper", "MetadataWrapper", "SegmentTrieNode", "ScrollAndMaybeFocusHandler",
    "InnerScrollHandlerNew", "InnerScrollHandlerOld", "DevToolsIndicator", "NextLogo", "DevOverlayRoot",
]);
export const isInternalName = (name) => INTERNAL.has(name) || /^__next_/.test(name) || /^Next\./.test(name) || (/Boundary$/.test(name) && /^(Metadata|Viewport|Outlet)/.test(name));
function keyStartingWith(obj, prefix) {
    for (const k of Object.keys(obj))
        if (k.startsWith(prefix))
            return k;
    return undefined;
}
export function getFiberFromNode(node) {
    if (!node)
        return null;
    const k = keyStartingWith(node, "__reactFiber$");
    return k ? node[k] : null;
}
/** Current HostRoot fibers of every React root on the page (except our own panel). */
export function findRoots() {
    const containers = [document];
    const next = document.getElementById("__next");
    if (next)
        containers.push(next);
    document.body?.childNodes.forEach(
    // Skip our own panel and Next's dev overlay root (<nextjs-portal>).
    (n) => n instanceof Element && n.id !== HOST_ID && n.tagName !== "NEXTJS-PORTAL" && containers.push(n));
    const roots = [];
    for (const c of containers) {
        const k = keyStartingWith(c, "__reactContainer$");
        const hostRoot = k ? c[k] : null;
        const current = hostRoot?.stateNode?.current ?? hostRoot;
        if (current && !roots.includes(current))
            roots.push(current);
    }
    return roots;
}
export function getDisplayName(fiber) {
    const t = fiber?.type;
    if (!t)
        return "Anonymous";
    if (typeof t === "string")
        return t;
    const inner = t.render ?? t.type ?? t;
    return t.displayName || inner?.displayName || inner?.name || t.name || "Anonymous";
}
export const isComponentFiber = (f) => f && COMPONENT_TAGS.has(f.tag);
// ---- stable ids across fiber alternates -----------------------------------
let nextId = 1;
const ids = new WeakMap();
export function idOf(obj) {
    const alt = obj.alternate;
    let id = ids.get(obj) ?? (alt ? ids.get(alt) : undefined);
    if (id === undefined)
        id = nextId++;
    ids.set(obj, id);
    if (alt)
        ids.set(alt, id);
    return id;
}
function debugInfoOf(f) {
    const info = f?._debugInfo;
    if (!Array.isArray(info))
        return [];
    return info.filter((i) => i && typeof i.name === "string");
}
/** Next's own error overlay is portaled into <nextjs-portal>; never part of "your" tree. */
function isNextOverlay(f) {
    for (let c = f, i = 0; c && i < 4; c = c.child, i++) {
        if (c.tag === 4 /* HostPortal */) {
            const container = c.stateNode?.containerInfo;
            const hostEl = container instanceof ShadowRoot ? container.host : container;
            // Next's error overlay and the Pages Router's route announcer
            return !!hostEl?.closest?.("nextjs-portal, next-route-announcer");
        }
    }
    return false;
}
function build(first, out, opts, depth) {
    if (depth > 400)
        return;
    const serverNodes = new Map();
    for (let f = first; f; f = f.sibling) {
        if (opts.hideInternals && isNextOverlay(f))
            continue;
        let target = out;
        // Server Components show up as debug info on the fibers they produced (React 19 dev).
        const fiberName = isComponentFiber(f) ? getDisplayName(f) : null;
        for (const info of debugInfoOf(f)) {
            if (opts.hideInternals && isInternalName(info.name))
                continue;
            // A client component referenced from the server also gets an entry — the fiber already shows it.
            if (info.name === fiberName)
                continue;
            let node = serverNodes.get(info);
            if (!node) {
                node = { id: idOf(info), name: info.name, kind: "server", env: info.env, key: info.key, info, fibers: [], children: [] };
                serverNodes.set(info, node);
                target.push(node);
            }
            node.fibers.push(f);
            target = node.children;
        }
        if (f.tag === 3 /* HostRoot */ || !isComponentFiber(f)) {
            if (f.child)
                build(f.child, target, opts, depth + 1);
            continue;
        }
        const name = getDisplayName(f);
        if (opts.hideInternals && isInternalName(name)) {
            if (f.child)
                build(f.child, target, opts, depth + 1);
            continue;
        }
        const node = { id: idOf(f), name, kind: "client", key: f.key, fibers: [f], children: [] };
        target.push(node);
        if (f.child)
            build(f.child, node.children, opts, depth + 1);
    }
}
export function buildTree(opts) {
    const out = [];
    for (const root of findRoots())
        build(root.child, out, opts, 0);
    return out;
}
export function walkTree(nodes, fn, parents = []) {
    for (const n of nodes) {
        fn(n, parents);
        walkTree(n.children, fn, [...parents, n]);
    }
}
// ---- DOM / source helpers ---------------------------------------------------
export function hostNodesOf(fiber, out = [], depth = 0) {
    if (!fiber || depth > 200)
        return out;
    if (isHostFiber(fiber) && fiber.stateNode instanceof Element) {
        out.push(fiber.stateNode);
        return out;
    }
    for (let c = fiber.child; c; c = c.sibling)
        hostNodesOf(c, out, depth + 1);
    return out;
}
export function nodeElements(node) {
    const out = [];
    for (const f of node.fibers)
        hostNodesOf(f, out);
    return out;
}
const sameFiber = (a, b) => a && b && (a === b || a === b.alternate);
/** Where in the source a component's own JSX lives: a host element it rendered directly. */
export function sourceOfNode(node) {
    const owner = node.kind === "server" ? node.info : node.fibers[0];
    let fallback = null;
    const visit = (f, depth) => {
        if (!f || depth > 200)
            return null;
        if (isHostFiber(f) && f.stateNode instanceof Element) {
            const loc = parseSource(f.stateNode.getAttribute(SOURCE_ATTR));
            if (loc) {
                if (f._debugOwner === owner || sameFiber(f._debugOwner, owner))
                    return loc;
                fallback ?? (fallback = loc);
            }
        }
        for (let c = f.child; c; c = c.sibling) {
            const r = visit(c, depth + 1);
            if (r)
                return r;
        }
        return null;
    };
    for (const f of node.fibers) {
        const r = node.kind === "server" ? visit(f, 0) : visit(f.child, 0);
        if (r)
            return r;
    }
    return fallback;
}
/** The component (client fiber or server info) that rendered a DOM element. */
export function ownerOfElement(el) {
    const fiber = getFiberFromNode(el);
    if (!fiber)
        return null;
    let owner = fiber._debugOwner;
    // Skip internals so the label names your component, not LayoutRouter.
    while (owner) {
        const isServer = typeof owner.tag !== "number";
        const name = isServer ? owner.name : getDisplayName(owner);
        if (!isInternalName(name))
            return { name, server: isServer, owner };
        owner = owner.owner ?? owner._debugOwner;
    }
    for (let f = fiber.return; f; f = f.return) {
        if (isComponentFiber(f) && !isInternalName(getDisplayName(f)))
            return { name: getDisplayName(f), server: false, owner: f };
    }
    return null;
}
// ---- inspecting values ------------------------------------------------------
export function preview(value, depth = 0, seen = new WeakSet()) {
    if (value === null)
        return "null";
    if (value === undefined)
        return "undefined";
    const t = typeof value;
    if (t === "string")
        return JSON.stringify(value.length > 200 ? value.slice(0, 200) + "…" : value);
    if (t === "number" || t === "boolean" || t === "bigint")
        return String(value);
    if (t === "symbol")
        return String(value);
    if (t === "function")
        return `ƒ ${value.name || "anonymous"}()`;
    const obj = value;
    if (seen.has(obj))
        return "[Circular]";
    seen.add(obj);
    if (obj.$$typeof) {
        const name = typeof obj.type === "string" ? obj.type : obj.type?.displayName || obj.type?.name || "Component";
        return `<${name} />`;
    }
    if (typeof Element !== "undefined" && obj instanceof Element)
        return `<${obj.tagName.toLowerCase()}>`;
    if (obj instanceof Date)
        return obj.toISOString();
    if (obj instanceof Promise || typeof obj.then === "function")
        return "Promise";
    if (depth >= 2)
        return Array.isArray(obj) ? `Array(${obj.length})` : "{…}";
    if (Array.isArray(obj)) {
        const items = obj.slice(0, 8).map((v) => preview(v, depth + 1, seen));
        return `[${items.join(", ")}${obj.length > 8 ? `, …${obj.length - 8} more` : ""}]`;
    }
    if (obj instanceof Map)
        return `Map(${obj.size})`;
    if (obj instanceof Set)
        return `Set(${obj.size})`;
    const keys = Object.keys(obj);
    const entries = keys.slice(0, 8).map((k) => `${k}: ${preview(obj[k], depth + 1, seen)}`);
    return `{ ${entries.join(", ")}${keys.length > 8 ? `, …${keys.length - 8} more` : ""} }`;
}
export function propsOf(node) {
    const raw = node.kind === "server" ? node.info?.props : node.fibers[0]?.memoizedProps;
    if (!raw || typeof raw !== "object")
        return {};
    const { children, ...rest } = raw;
    return children === undefined ? rest : { ...rest, children };
}
/** useState / useReducer values (function components) or this.state (classes). */
export function stateOf(node) {
    if (node.kind !== "client")
        return [];
    const f = node.fibers[0];
    if (f.tag === ClassComponent)
        return f.memoizedState ? [f.memoizedState] : [];
    const out = [];
    for (let h = f.memoizedState, i = 0; h && i < 100; h = h.next, i++) {
        if (h.queue && typeof h.queue.dispatch === "function")
            out.push(h.memoizedState);
    }
    return out;
}
// ---- commit subscription ----------------------------------------------------
/** Calls `fn` (throttled) after React commits; falls back to polling without the DevTools hook. */
export function onCommit(fn, interval = 1500) {
    let timer = null;
    const schedule = () => {
        if (timer)
            return;
        timer = setTimeout(() => {
            timer = null;
            fn();
        }, 250);
    };
    const hook = window.__REACT_DEVTOOLS_GLOBAL_HOOK__;
    let restore = null;
    if (hook && typeof hook.onCommitFiberRoot === "function") {
        const original = hook.onCommitFiberRoot;
        hook.onCommitFiberRoot = function (...args) {
            schedule();
            return original.apply(this, args);
        };
        restore = () => {
            hook.onCommitFiberRoot = original;
        };
    }
    const poll = setInterval(schedule, interval);
    return () => {
        clearInterval(poll);
        if (timer)
            clearTimeout(timer);
        restore?.();
    };
}
