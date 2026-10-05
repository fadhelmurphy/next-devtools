import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { openInEditor, type SourceLocation } from "./api.js";
import { Ctx, useSettings, type DevtoolsContext } from "./context.js";
import { HOST_ID } from "./fiber.js";
import {
  IconAssets,
  IconClose,
  IconComponents,
  IconConfig,
  IconInspect,
  IconMoon,
  IconNetwork,
  IconOverview,
  IconPackages,
  IconPayload,
  IconPerformance,
  IconRoutes,
  IconSettings,
  IconSun,
  Mark,
} from "./icons.js";
import { startInspector, stopInspector, type InspectorMode } from "./overlay.js";
import { updateSettings } from "./settings.js";
import { Assets } from "./tabs/Assets.js";
import { Config } from "./tabs/Config.js";
import { Network } from "./tabs/Network.js";
import { Packages } from "./tabs/Packages.js";
import { Payload } from "./tabs/Payload.js";
import { Components } from "./tabs/Components.js";
import { Overview } from "./tabs/Overview.js";
import { Performance } from "./tabs/Performance.js";
import { Routes } from "./tabs/Routes.js";
import { SettingsTab } from "./tabs/Settings.js";
import { getVitals, rate, subscribeVitals } from "./vitals.js";

type TabDef = { id: string; label: string; icon: () => ReactNode; render: () => ReactNode; flush?: boolean };
const TABS: TabDef[] = [
  { id: "overview", label: "Overview", icon: IconOverview, render: () => <Overview /> },
  { id: "components", label: "Components", icon: IconComponents, render: () => <Components />, flush: true },
  { id: "routes", label: "Routes", icon: IconRoutes, render: () => <Routes /> },
  { id: "assets", label: "Assets", icon: IconAssets, render: () => <Assets /> },
  { id: "packages", label: "Packages", icon: IconPackages, render: () => <Packages /> },
  { id: "config", label: "Config", icon: IconConfig, render: () => <Config /> },
  { id: "payload", label: "Payload", icon: IconPayload, render: () => <Payload /> },
  { id: "network", label: "Network", icon: IconNetwork, render: () => <Network />, flush: true },
  { id: "performance", label: "Performance", icon: IconPerformance, render: () => <Performance /> },
];
const SETTINGS_TAB: TabDef = { id: "settings", label: "Settings", icon: IconSettings, render: () => <SettingsTab /> };
const ALL_TABS = [...TABS, SETTINGS_TAB];

function usePrefersLight() {
  const [light, set] = useState(() => window.matchMedia?.("(prefers-color-scheme: light)").matches ?? false);
  useEffect(() => {
    const mq = window.matchMedia?.("(prefers-color-scheme: light)");
    if (!mq) return;
    const fn = () => set(mq.matches);
    mq.addEventListener("change", fn);
    return () => mq.removeEventListener("change", fn);
  }, []);
  return light;
}

const defaultHeight = () => Math.round(Math.min(Math.max(window.innerHeight * 0.55, 360), window.innerHeight - 40));

function LcpChip() {
  const [lcp, setLcp] = useState(() => getVitals().lcp);
  useEffect(() => subscribeVitals(() => setLcp(getVitals().lcp)), []);
  if (lcp == null) return null;
  const r = rate("lcp", lcp);
  return (
    <span
      className="nd-dock-metric"
      title="Largest Contentful Paint for this page load"
      style={{ color: r === "good" ? "var(--good)" : r === "poor" ? "var(--bad)" : "var(--warn)" }}
    >
      {lcp >= 1000 ? `${(lcp / 1000).toFixed(1)}s` : `${Math.round(lcp)}ms`}
    </span>
  );
}

export function App() {
  const settings = useSettings();
  const prefersLight = usePrefersLight();
  const [picking, setPicking] = useState<InspectorMode | null>(null);
  const [toastMsg, setToast] = useState<string | null>(null);
  const [pendingReveal, setPendingReveal] = useState<Element | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const open = settings.open;
  const tab = ALL_TABS.find((t) => t.id === settings.tab) ?? TABS[0];
  const setOpen = (v: boolean) => updateSettings({ open: v });
  const setTab = useCallback((id: string) => updateSettings({ tab: id, open: true }), []);

  const toast = useCallback((msg: string) => {
    setToast(msg);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2600);
  }, []);

  const openSource = useCallback(
    (loc: SourceLocation | null | undefined) => {
      if (!loc) return toast("No source location for this element");
      openInEditor(loc).then(toast);
    },
    [toast],
  );

  const pick = useCallback(
    (mode: InspectorMode) => {
      if (picking) return stopInspector();
      setPicking(mode);
      startInspector(
        mode,
        ({ element, source }) => {
          if (mode === "editor") openSource(source);
          else {
            setPendingReveal(element);
            updateSettings({ tab: "components", open: true });
          }
        },
        () => setPicking(null),
      );
    },
    [picking, openSource],
  );

  // Global shortcuts. `code` keeps them working on macOS where Alt changes `key`.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.shiftKey && e.altKey && !e.metaKey && !e.ctrlKey) {
        if (e.code === "KeyD") {
          e.preventDefault();
          if (picking) stopInspector();
          updateSettings({ open: !settings.open });
        } else if (e.code === "KeyC") {
          e.preventDefault();
          pick("editor");
        }
      } else if (e.key === "Escape" && settings.open && !picking) {
        const inside = e.composedPath().some((n) => (n as Element).id === HOST_ID);
        if (inside) updateSettings({ open: false });
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [settings.open, picking, pick]);

  useEffect(() => () => stopInspector(), []);

  // Resize by dragging the top edge
  const [dragging, setDragging] = useState(false);
  const height = Math.min(settings.height || defaultHeight(), window.innerHeight - 24);
  const onResizeStart = (e: React.PointerEvent) => {
    e.preventDefault();
    setDragging(true);
    const move = (ev: PointerEvent) => {
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

  const ctx: DevtoolsContext = {
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

  return (
    <Ctx.Provider value={ctx}>
      <div className="nd-root" data-theme={theme}>
        {!showPanel && settings.showButton && (
          <div className="nd-dock" role="toolbar" aria-label="Next DevTools">
            <button className="nd-mark-btn" onClick={() => setOpen(true)} title="Open DevTools (Shift + Alt + D)" aria-label="Open DevTools">
              <Mark />
              <LcpChip />
            </button>
            <span className="nd-dock-sep" />
            <button
              aria-pressed={picking === "editor"}
              onClick={() => pick("editor")}
              title="Inspect an element and open its source (Shift + Alt + C)"
              aria-label="Inspect an element"
            >
              <IconInspect />
            </button>
          </div>
        )}

        {picking && !settings.showButton && (
          <div className="nd-dock" role="status">
            <button aria-pressed="true" onClick={() => stopInspector()}>
              <IconInspect /> Click an element, Esc to stop
            </button>
          </div>
        )}

        {showPanel && (
          <div className="nd-panel" style={{ height }} role="dialog" aria-label="Next DevTools">
            <div className="nd-resize" data-dragging={dragging || undefined} onPointerDown={onResizeStart} aria-hidden="true" />
            <nav className="nd-rail" role="tablist" aria-label="DevTools sections">
              <div className="nd-brand">
                <Mark />
                <div>
                  Next DevTools
                  <small>{(window as any).next?.version ? `Next.js ${(window as any).next.version}` : "Development"}</small>
                </div>
                <button
                  className="nd-icon-btn nd-theme-btn"
                  onClick={() => updateSettings({ theme: theme === "dark" ? "light" : "dark" })}
                  title={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
                  aria-label="Toggle theme"
                >
                  {theme === "dark" ? <IconMoon /> : <IconSun />}
                </button>
              </div>
              {TABS.map((t) => (
                <button key={t.id} className="nd-tab" role="tab" aria-selected={t.id === tab.id} onClick={() => setTab(t.id)}>
                  {t.icon()}
                  <span>{t.label}</span>
                </button>
              ))}
              <div className="nd-rail-spacer" />
              <button className="nd-tab" role="tab" aria-selected={tab.id === "settings"} onClick={() => setTab("settings")}>
                {SETTINGS_TAB.icon()}
                <span>{SETTINGS_TAB.label}</span>
              </button>
            </nav>
            <main className="nd-main">
              <header className="nd-head">
                <h2>{tab.label}</h2>
                <div className="nd-head-actions">
                  <button className="nd-btn" onClick={() => pick("editor")} title="Shift + Alt + C">
                    <IconInspect /> Inspect
                  </button>
                  <button className="nd-icon-btn" onClick={() => setOpen(false)} title="Close (Shift + Alt + D)" aria-label="Close DevTools">
                    <IconClose />
                  </button>
                </div>
              </header>
              <div className={`nd-body${tab.flush ? " nd-flush" : ""}`} role="tabpanel">
                {tab.render()}
              </div>
            </main>
          </div>
        )}

        {toastMsg && (
          <div className="nd-toast" role="status">
            {toastMsg}
          </div>
        )}
      </div>
    </Ctx.Provider>
  );
}
