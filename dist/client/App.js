import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useCallback, useEffect, useRef, useState } from "react";
import { openInEditor } from "./api.js";
import { Ctx, useSettings } from "./context.js";
import { HOST_ID } from "./fiber.js";
import { IconAssets, IconClose, IconComponents, IconInspect, IconOverview, IconPerformance, IconRoutes, IconSettings, Mark, } from "./icons.js";
import { startInspector, stopInspector } from "./overlay.js";
import { updateSettings } from "./settings.js";
import { Assets } from "./tabs/Assets.js";
import { Components } from "./tabs/Components.js";
import { Overview } from "./tabs/Overview.js";
import { Performance } from "./tabs/Performance.js";
import { Routes } from "./tabs/Routes.js";
import { SettingsTab } from "./tabs/Settings.js";
import { getVitals, rate, subscribeVitals } from "./vitals.js";
const TABS = [
    { id: "overview", label: "Overview", icon: IconOverview, render: () => _jsx(Overview, {}) },
    { id: "components", label: "Components", icon: IconComponents, render: () => _jsx(Components, {}), flush: true },
    { id: "routes", label: "Routes", icon: IconRoutes, render: () => _jsx(Routes, {}) },
    { id: "assets", label: "Assets", icon: IconAssets, render: () => _jsx(Assets, {}) },
    { id: "performance", label: "Performance", icon: IconPerformance, render: () => _jsx(Performance, {}) },
    { id: "settings", label: "Settings", icon: IconSettings, render: () => _jsx(SettingsTab, {}) },
];
function usePrefersLight() {
    const [light, set] = useState(() => window.matchMedia?.("(prefers-color-scheme: light)").matches ?? false);
    useEffect(() => {
        const mq = window.matchMedia?.("(prefers-color-scheme: light)");
        if (!mq)
            return;
        const fn = () => set(mq.matches);
        mq.addEventListener("change", fn);
        return () => mq.removeEventListener("change", fn);
    }, []);
    return light;
}
const defaultHeight = () => Math.round(Math.min(Math.max(window.innerHeight * 0.48, 320), window.innerHeight - 40));
function LcpChip() {
    const [lcp, setLcp] = useState(() => getVitals().lcp);
    useEffect(() => subscribeVitals(() => setLcp(getVitals().lcp)), []);
    if (lcp == null)
        return null;
    const r = rate("lcp", lcp);
    return (_jsx("span", { className: "nd-dock-metric", title: "Largest Contentful Paint for this page load", style: { color: r === "good" ? "var(--good)" : r === "poor" ? "var(--bad)" : "var(--warn)" }, children: lcp >= 1000 ? `${(lcp / 1000).toFixed(1)}s` : `${Math.round(lcp)}ms` }));
}
export function App() {
    const settings = useSettings();
    const prefersLight = usePrefersLight();
    const [picking, setPicking] = useState(null);
    const [toastMsg, setToast] = useState(null);
    const [pendingReveal, setPendingReveal] = useState(null);
    const toastTimer = useRef(undefined);
    const open = settings.open;
    const tab = TABS.find((t) => t.id === settings.tab) ?? TABS[0];
    const setOpen = (v) => updateSettings({ open: v });
    const setTab = useCallback((id) => updateSettings({ tab: id, open: true }), []);
    const toast = useCallback((msg) => {
        setToast(msg);
        clearTimeout(toastTimer.current);
        toastTimer.current = setTimeout(() => setToast(null), 2600);
    }, []);
    const openSource = useCallback((loc) => {
        if (!loc)
            return toast("No source location for this element");
        openInEditor(loc).then(toast);
    }, [toast]);
    const pick = useCallback((mode) => {
        if (picking)
            return stopInspector();
        setPicking(mode);
        startInspector(mode, ({ element, source }) => {
            if (mode === "editor")
                openSource(source);
            else {
                setPendingReveal(element);
                updateSettings({ tab: "components", open: true });
            }
        }, () => setPicking(null));
    }, [picking, openSource]);
    // Global shortcuts. `code` keeps them working on macOS where Alt changes `key`.
    useEffect(() => {
        const onKey = (e) => {
            if (e.shiftKey && e.altKey && !e.metaKey && !e.ctrlKey) {
                if (e.code === "KeyD") {
                    e.preventDefault();
                    if (picking)
                        stopInspector();
                    updateSettings({ open: !settings.open });
                }
                else if (e.code === "KeyC") {
                    e.preventDefault();
                    pick("editor");
                }
            }
            else if (e.key === "Escape" && settings.open && !picking) {
                const inside = e.composedPath().some((n) => n.id === HOST_ID);
                if (inside)
                    updateSettings({ open: false });
            }
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [settings.open, picking, pick]);
    useEffect(() => () => stopInspector(), []);
    // Resize by dragging the top edge
    const [dragging, setDragging] = useState(false);
    const height = Math.min(settings.height || defaultHeight(), window.innerHeight - 24);
    const onResizeStart = (e) => {
        e.preventDefault();
        setDragging(true);
        const move = (ev) => {
            const h = Math.min(Math.max(window.innerHeight - ev.clientY - 10, 200), window.innerHeight - 24);
            updateSettings({ height: Math.round(h) });
        };
        const up = () => {
            setDragging(false);
            window.removeEventListener("pointermove", move);
            window.removeEventListener("pointerup", up);
        };
        window.addEventListener("pointermove", move);
        window.addEventListener("pointerup", up);
    };
    const ctx = {
        toast,
        open: openSource,
        reveal: (el) => {
            setPendingReveal(el);
            setTab("components");
        },
        pendingReveal,
        clearReveal: useCallback(() => setPendingReveal(null), []),
        setTab,
        startPick: () => pick("select"),
        picking: picking === "select",
    };
    const theme = settings.theme === "system" ? (prefersLight ? "light" : "dark") : settings.theme;
    const showPanel = open && !picking;
    return (_jsx(Ctx.Provider, { value: ctx, children: _jsxs("div", { className: "nd-root", "data-theme": theme, children: [!showPanel && settings.showButton && (_jsxs("div", { className: "nd-dock", role: "toolbar", "aria-label": "Next DevTools", children: [_jsxs("button", { className: "nd-mark-btn", onClick: () => setOpen(true), title: "Open DevTools (Shift + Alt + D)", "aria-label": "Open DevTools", children: [_jsx(Mark, {}), _jsx(LcpChip, {})] }), _jsx("span", { className: "nd-dock-sep" }), _jsx("button", { "aria-pressed": picking === "editor", onClick: () => pick("editor"), title: "Inspect an element and open its source (Shift + Alt + C)", "aria-label": "Inspect an element", children: _jsx(IconInspect, {}) })] })), picking && !settings.showButton && (_jsx("div", { className: "nd-dock", role: "status", children: _jsxs("button", { "aria-pressed": "true", onClick: () => stopInspector(), children: [_jsx(IconInspect, {}), " Click an element, Esc to stop"] }) })), showPanel && (_jsxs("div", { className: "nd-panel", style: { height }, role: "dialog", "aria-label": "Next DevTools", children: [_jsx("div", { className: "nd-resize", "data-dragging": dragging || undefined, onPointerDown: onResizeStart, "aria-hidden": "true" }), _jsxs("nav", { className: "nd-rail", role: "tablist", "aria-label": "DevTools sections", children: [_jsxs("div", { className: "nd-brand", children: [_jsx(Mark, {}), _jsxs("div", { children: ["Next DevTools", _jsx("small", { children: window.next?.version ? `Next.js ${window.next.version}` : "Development" })] })] }), TABS.map((t) => (_jsxs("button", { className: "nd-tab", role: "tab", "aria-selected": t.id === tab.id, onClick: () => setTab(t.id), children: [t.icon(), _jsx("span", { children: t.label })] }, t.id))), _jsx("div", { className: "nd-rail-spacer" })] }), _jsxs("main", { className: "nd-main", children: [_jsxs("header", { className: "nd-head", children: [_jsx("h2", { children: tab.label }), _jsxs("div", { className: "nd-head-actions", children: [_jsxs("button", { className: "nd-btn", onClick: () => pick("editor"), title: "Shift + Alt + C", children: [_jsx(IconInspect, {}), " Inspect"] }), _jsx("button", { className: "nd-icon-btn", onClick: () => setOpen(false), title: "Close (Shift + Alt + D)", "aria-label": "Close DevTools", children: _jsx(IconClose, {}) })] })] }), _jsx("div", { className: `nd-body${tab.flush ? " nd-flush" : ""}`, role: "tabpanel", children: tab.render() })] })] })), toastMsg && (_jsx("div", { className: "nd-toast", role: "status", children: toastMsg }))] }) }));
}
