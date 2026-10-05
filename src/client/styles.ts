/* All styles live inside the shadow root, so nothing leaks in or out of the host app. */
export const styles = /* css */ `
:host { all: initial; }

.nd-root {
  --bg: #1d1f2c;
  --surface: #24273a;
  --raise: #2d3149;
  --line: #383c58;
  --line-soft: #2e3248;
  --text: #e8e9f3;
  --muted: #9a9dba;
  --faint: #6c7092;
  --accent: #9aa5ff;
  --accent-strong: #b8c0ff;
  --accent-ink: #141632;
  --accent-wash: rgba(154, 165, 255, 0.14);
  --server: #f2b65c;
  --server-wash: rgba(242, 182, 92, 0.14);
  --client: #73d4c1;
  --client-wash: rgba(115, 212, 193, 0.13);
  --good: #6dd59a;
  --warn: #f2b65c;
  --bad: #ff8593;
  --shadow: 0 18px 50px rgba(5, 6, 20, 0.55), 0 2px 8px rgba(5, 6, 20, 0.4);
  --sans: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  --mono: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace;

  font-family: var(--sans);
  font-size: 13px;
  line-height: 1.45;
  color: var(--text);
  -webkit-font-smoothing: antialiased;
}
.nd-root[data-theme="light"] {
  --bg: #f6f6fb;
  --surface: #ffffff;
  --raise: #eceefa;
  --line: #d5d8ec;
  --line-soft: #e4e6f4;
  --text: #1c1e33;
  --muted: #5d6185;
  --faint: #8b8fae;
  --accent: #4a57e0;
  --accent-strong: #3442cc;
  --accent-ink: #ffffff;
  --accent-wash: rgba(74, 87, 224, 0.1);
  --server: #a8670b;
  --server-wash: rgba(214, 140, 30, 0.13);
  --client: #0f8a73;
  --client-wash: rgba(15, 138, 115, 0.1);
  --good: #178a4c;
  --warn: #a8670b;
  --bad: #cc2f45;
  --shadow: 0 18px 50px rgba(30, 34, 80, 0.18), 0 2px 8px rgba(30, 34, 80, 0.1);
}

.nd-root *, .nd-root *::before, .nd-root *::after { box-sizing: border-box; }
.nd-root button { font: inherit; color: inherit; }
.nd-root :focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
.nd-root code, .nd-mono { font-family: var(--mono); font-size: 12px; }

/* ---------- highlight layer ---------- */
.nd-layer { position: fixed; inset: 0; pointer-events: none; z-index: 2147483646; }
.nd-box {
  position: fixed;
  left: 0; top: 0;
  border: 1.5px solid var(--accent);
  background: var(--accent-wash);
  border-radius: 3px;
  transition: transform .06s, width .06s, height .06s;
}
.nd-tip {
  position: fixed;
  left: 0; top: 0;
  max-width: min(440px, calc(100vw - 8px));
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: 8px;
  box-shadow: var(--shadow);
  padding: 8px 10px;
}
.nd-tip-head { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
.nd-tip-name { font-weight: 650; color: var(--accent-strong); }
.nd-tip-tag { font-family: var(--mono); font-size: 11.5px; color: var(--muted); }
.nd-tip-src { font-family: var(--mono); font-size: 11.5px; color: var(--text); margin-top: 3px; word-break: break-all; }
.nd-tip-foot { display: flex; justify-content: space-between; gap: 12px; margin-top: 6px; font-size: 11px; color: var(--faint); }

/* ---------- floating button ---------- */
.nd-dock {
  position: fixed;
  left: 50%;
  bottom: 14px;
  transform: translateX(-50%);
  z-index: 2147483645;
  display: flex;
  align-items: center;
  gap: 2px;
  padding: 3px;
  background: var(--bg);
  border: 1px solid var(--line);
  border-radius: 999px;
  box-shadow: var(--shadow);
}
.nd-dock button {
  display: inline-flex; align-items: center; gap: 6px;
  height: 30px; padding: 0 10px;
  border: 0; border-radius: 999px; background: transparent; cursor: pointer;
  color: var(--muted);
}
.nd-dock button:hover { background: var(--raise); color: var(--text); }
.nd-dock button[aria-pressed="true"] { background: var(--accent); color: var(--accent-ink); }
.nd-dock .nd-mark-btn { padding: 0 8px 0 7px; color: var(--text); }
.nd-dock-metric { font-family: var(--mono); font-size: 11.5px; }
.nd-dock-sep { width: 1px; height: 16px; background: var(--line); }
.nd-mark { width: 18px; height: 18px; flex: none; }

/* ---------- panel ---------- */
.nd-panel {
  position: fixed;
  left: 10px; right: 10px; bottom: 10px;
  z-index: 2147483645;
  display: grid;
  grid-template-columns: 184px 1fr;
  background: var(--bg);
  border: 1px solid var(--line);
  border-radius: 12px;
  box-shadow: var(--shadow);
  overflow: hidden;
  animation: nd-in .16s ease-out;
}
@keyframes nd-in { from { opacity: 0; transform: translateY(10px); } }
@media (prefers-reduced-motion: reduce) { .nd-panel { animation: none; } .nd-box { transition: none; } }

.nd-resize {
  position: absolute; left: 0; right: 0; top: 0; height: 6px;
  cursor: ns-resize; z-index: 2;
}
.nd-resize:hover, .nd-resize[data-dragging] { background: var(--accent-wash); }

.nd-rail {
  display: flex; flex-direction: column; gap: 2px;
  padding: 12px 8px 56px; /* bottom room for Next's own dev indicator */
  background: var(--surface);
  border-right: 1px solid var(--line-soft);
  overflow-y: auto;
}
.nd-brand { display: flex; align-items: center; gap: 8px; padding: 2px 4px 12px 8px; font-weight: 650; letter-spacing: -0.01em; white-space: nowrap; font-size: 12.5px; }
.nd-brand small { display: block; font-weight: 450; color: var(--faint); font-size: 11px; }
.nd-tab {
  display: flex; align-items: center; gap: 9px;
  width: 100%; padding: 6px 9px;
  border: 0; border-radius: 7px; background: transparent; cursor: pointer;
  color: var(--muted); text-align: left;
}
.nd-tab svg { width: 16px; height: 16px; flex: none; }
.nd-tab:hover { background: var(--raise); color: var(--text); }
.nd-tab[aria-selected="true"] { background: var(--accent-wash); color: var(--accent-strong); }
.nd-rail-spacer { flex: 1; }

.nd-main { display: flex; flex-direction: column; min-width: 0; min-height: 0; }
.nd-head {
  display: flex; align-items: center; gap: 10px;
  min-height: 46px; padding: 8px 10px 8px 18px;
  border-bottom: 1px solid var(--line-soft);
}
.nd-head h2 { margin: 0; font-size: 14px; font-weight: 650; letter-spacing: -0.01em; }
.nd-head-actions { margin-left: auto; display: flex; align-items: center; gap: 6px; }
.nd-body { flex: 1; overflow: auto; padding: 16px 18px 22px; min-height: 0; }
.nd-body.nd-flush { padding: 0; overflow: hidden; display: flex; }

/* ---------- controls ---------- */
.nd-btn {
  display: inline-flex; align-items: center; gap: 6px;
  height: 28px; padding: 0 10px;
  border: 1px solid var(--line); border-radius: 7px;
  background: var(--surface); cursor: pointer; white-space: nowrap;
}
.nd-btn:hover { border-color: var(--faint); }
.nd-btn svg { width: 14px; height: 14px; }
.nd-btn-primary { background: var(--accent); border-color: var(--accent); color: var(--accent-ink) !important; font-weight: 600; }
.nd-btn-primary:hover { background: var(--accent-strong); }
.nd-btn[aria-pressed="true"] { background: var(--accent-wash); border-color: var(--accent); color: var(--accent-strong); }
.nd-icon-btn {
  display: inline-grid; place-items: center;
  width: 28px; height: 28px; border: 0; border-radius: 7px; background: transparent;
  color: var(--muted); cursor: pointer;
}
.nd-icon-btn:hover { background: var(--raise); color: var(--text); }
.nd-icon-btn svg { width: 15px; height: 15px; }
.nd-input, .nd-select {
  height: 28px; padding: 0 9px;
  border: 1px solid var(--line); border-radius: 7px;
  background: var(--surface); color: var(--text); font: inherit;
  min-width: 0;
}
.nd-input::placeholder { color: var(--faint); }
.nd-input:focus, .nd-select:focus { outline: none; border-color: var(--accent); }
.nd-check { display: inline-flex; align-items: center; gap: 6px; color: var(--muted); cursor: pointer; user-select: none; white-space: nowrap; }
.nd-check input { accent-color: var(--accent); margin: 0; }

.nd-badge {
  display: inline-flex; align-items: center;
  height: 18px; padding: 0 6px; border-radius: 5px;
  font-size: 10.5px; font-weight: 600; white-space: nowrap;
  background: var(--raise); color: var(--muted);
}
.nd-badge-server { background: var(--server-wash); color: var(--server); }
.nd-badge-client { background: var(--client-wash); color: var(--client); }
.nd-badge-accent { background: var(--accent-wash); color: var(--accent-strong); }

.nd-root .nd-link { border: 0; background: none; padding: 0; cursor: pointer; color: var(--accent-strong); text-align: left; font: inherit; }
.nd-link:hover { text-decoration: underline; }
.nd-file { font-family: var(--mono); font-size: 11.5px; color: var(--muted); border: 0; background: none; padding: 0; cursor: pointer; text-align: left; word-break: break-all; }
.nd-file:hover { color: var(--accent-strong); text-decoration: underline; }

.nd-muted { color: var(--muted); }
.nd-faint { color: var(--faint); }
.nd-empty { padding: 28px 4px; color: var(--muted); max-width: 60ch; }
.nd-empty strong { display: block; color: var(--text); margin-bottom: 4px; }
.nd-error {
  border: 1px solid color-mix(in srgb, var(--bad) 45%, transparent);
  background: color-mix(in srgb, var(--bad) 9%, transparent);
  color: var(--text); border-radius: 9px; padding: 12px 14px; max-width: 70ch;
}
.nd-error strong { color: var(--bad); display: block; margin-bottom: 2px; }

.nd-section { margin-top: 22px; }
.nd-section:first-child { margin-top: 0; }
.nd-section > h3 { margin: 0 0 8px; font-size: 12.5px; font-weight: 650; color: var(--muted); }

/* ---------- overview ---------- */
.nd-hero { display: flex; align-items: flex-end; gap: 16px; flex-wrap: wrap; }
.nd-hero h1 { margin: 0; font-size: 26px; line-height: 1.1; font-weight: 700; letter-spacing: -0.025em; }
.nd-hero p { margin: 4px 0 0; color: var(--muted); }
.nd-facts { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); border-top: 1px solid var(--line-soft); border-left: 1px solid var(--line-soft); }
.nd-fact { padding: 10px 12px; border-right: 1px solid var(--line-soft); border-bottom: 1px solid var(--line-soft); }
.nd-fact dt { font-size: 11.5px; color: var(--faint); }
.nd-fact dd { margin: 2px 0 0; font-weight: 600; font-variant-numeric: tabular-nums; overflow-wrap: anywhere; }
.nd-chain { display: flex; flex-direction: column; gap: 0; border-left: 2px solid var(--line); margin-left: 4px; }
.nd-chain-item { display: flex; align-items: center; gap: 8px; padding: 4px 0 4px 12px; position: relative; }
.nd-chain-item::before { content: ""; position: absolute; left: -5px; top: 50%; width: 8px; height: 8px; margin-top: -4px; border-radius: 50%; background: var(--bg); border: 2px solid var(--faint); }
.nd-chain-item[data-kind="page"]::before { border-color: var(--accent); background: var(--accent); }
.nd-kv { width: 100%; border-collapse: collapse; }
.nd-kv td { padding: 5px 10px 5px 0; border-bottom: 1px solid var(--line-soft); vertical-align: top; }
.nd-kv td:first-child { font-family: var(--mono); font-size: 12px; color: var(--muted); width: 1%; white-space: nowrap; padding-right: 20px; }
.nd-kv td:last-child { font-family: var(--mono); font-size: 12px; word-break: break-all; }

/* ---------- tables (routes) ---------- */
.nd-toolbar { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; margin-bottom: 12px; }
.nd-toolbar .nd-input { flex: 1; min-width: 160px; max-width: 360px; }
.nd-table { width: 100%; border-collapse: collapse; }
.nd-table th { text-align: left; font-weight: 600; font-size: 11.5px; color: var(--faint); padding: 0 12px 6px 0; border-bottom: 1px solid var(--line); white-space: nowrap; }
.nd-table td { padding: 7px 12px 7px 0; border-bottom: 1px solid var(--line-soft); vertical-align: middle; }
.nd-table tr[data-current] td:first-child { box-shadow: inset 2px 0 var(--accent); padding-left: 8px; }
.nd-table tr[data-current] .nd-route { color: var(--accent-strong); }
.nd-route { font-family: var(--mono); font-size: 12.5px; }
.nd-route .nd-seg-dyn { color: var(--server); }
.nd-params { display: flex; gap: 6px; flex-wrap: wrap; align-items: center; margin-top: 6px; }
.nd-params .nd-input { width: 130px; height: 26px; }

/* ---------- components ---------- */
.nd-split { display: grid; grid-template-columns: minmax(240px, 1.1fr) minmax(240px, 1fr); flex: 1; min-height: 0; width: 100%; }
.nd-pane { display: flex; flex-direction: column; min-height: 0; min-width: 0; }
.nd-pane + .nd-pane { border-left: 1px solid var(--line-soft); }
.nd-pane-bar { display: flex; align-items: center; gap: 6px; padding: 8px 10px; border-bottom: 1px solid var(--line-soft); flex-wrap: wrap; }
.nd-pane-bar .nd-input { flex: 1; min-width: 100px; }
.nd-pane-body { flex: 1; overflow: auto; padding: 6px 0 14px; }
.nd-tree-row {
  display: flex; align-items: center; gap: 4px;
  height: 24px; padding-right: 10px;
  cursor: pointer; white-space: nowrap; user-select: none;
}
.nd-tree-row:hover { background: var(--raise); }
.nd-tree-row[aria-selected="true"] { background: var(--accent-wash); }
.nd-tree-row[aria-selected="true"] .nd-tree-name { color: var(--accent-strong); }
.nd-tree-toggle { width: 16px; height: 16px; display: inline-grid; place-items: center; border: 0; background: none; padding: 0; color: var(--faint); cursor: pointer; flex: none; }
.nd-tree-toggle svg { width: 10px; height: 10px; transition: transform .1s; }
.nd-tree-toggle[aria-expanded="true"] svg { transform: rotate(90deg); }
.nd-tree-name { font-family: var(--mono); font-size: 12px; }
.nd-tree-name::before { content: "<"; color: var(--faint); }
.nd-tree-name::after { content: ">"; color: var(--faint); }
.nd-tree-row[data-kind="server"] .nd-tree-name { color: var(--server); }
.nd-tree-key { font-family: var(--mono); font-size: 11px; color: var(--faint); }
.nd-tree-match .nd-tree-name { text-decoration: underline; text-decoration-color: var(--accent); text-underline-offset: 3px; }
.nd-detail { padding: 14px 16px; }
.nd-detail h3 { margin: 0; font-family: var(--mono); font-size: 14px; font-weight: 600; display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.nd-detail .nd-section { margin-top: 16px; }
.nd-props { width: 100%; border-collapse: collapse; }
.nd-props td { padding: 3px 0; vertical-align: top; font-family: var(--mono); font-size: 12px; }
.nd-props td:first-child { color: var(--accent-strong); padding-right: 10px; white-space: nowrap; width: 1%; }
.nd-props td:last-child { word-break: break-all; color: var(--text); }
.nd-crumbs { display: flex; flex-wrap: wrap; gap: 2px 4px; font-family: var(--mono); font-size: 11.5px; color: var(--faint); }
.nd-crumbs button { border: 0; background: none; padding: 0; cursor: pointer; color: var(--muted); font: inherit; }
.nd-crumbs button:hover { color: var(--accent-strong); }

/* ---------- assets ---------- */
.nd-assets { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 10px; }
.nd-asset { border: 1px solid var(--line-soft); border-radius: 10px; overflow: hidden; background: var(--surface); display: flex; flex-direction: column; text-align: left; padding: 0; cursor: pointer; }
.nd-asset:hover { border-color: var(--accent); }
.nd-asset-preview {
  height: 96px; display: grid; place-items: center;
  background-color: var(--raise);
  background-image: linear-gradient(45deg, var(--line-soft) 25%, transparent 25%), linear-gradient(-45deg, var(--line-soft) 25%, transparent 25%), linear-gradient(45deg, transparent 75%, var(--line-soft) 75%), linear-gradient(-45deg, transparent 75%, var(--line-soft) 75%);
  background-size: 12px 12px; background-position: 0 0, 0 6px, 6px -6px, -6px 0;
  color: var(--faint); font-family: var(--mono); font-size: 12px; text-transform: lowercase;
}
.nd-asset-preview img { max-width: 100%; max-height: 96px; object-fit: contain; }
.nd-asset-meta { padding: 7px 9px; }
.nd-asset-name { font-family: var(--mono); font-size: 11.5px; word-break: break-all; }
.nd-asset-size { font-size: 11px; color: var(--faint); }

/* ---------- performance ---------- */
.nd-vitals { display: grid; grid-template-columns: repeat(auto-fill, minmax(170px, 1fr)); gap: 10px; }
.nd-vital { border: 1px solid var(--line-soft); border-radius: 10px; padding: 12px 14px; background: var(--surface); }
.nd-vital-name { display: flex; justify-content: space-between; gap: 8px; color: var(--muted); font-size: 12px; }
.nd-vital-value { font-size: 24px; font-weight: 700; letter-spacing: -0.02em; margin-top: 4px; font-variant-numeric: tabular-nums; }
.nd-vital-value small { font-size: 13px; font-weight: 500; color: var(--muted); margin-left: 2px; }
.nd-vital[data-rating="good"] .nd-vital-value { color: var(--good); }
.nd-vital[data-rating="needs-improvement"] .nd-vital-value { color: var(--warn); }
.nd-vital[data-rating="poor"] .nd-vital-value { color: var(--bad); }
.nd-meter { height: 4px; border-radius: 4px; background: var(--raise); margin-top: 10px; overflow: hidden; }
.nd-meter span { display: block; height: 100%; background: currentColor; border-radius: inherit; }
.nd-vital[data-rating="good"] .nd-meter { color: var(--good); }
.nd-vital[data-rating="needs-improvement"] .nd-meter { color: var(--warn); }
.nd-vital[data-rating="poor"] .nd-meter { color: var(--bad); }
.nd-waterfall { display: flex; flex-direction: column; gap: 6px; max-width: 760px; }
.nd-wf-row { display: grid; grid-template-columns: 120px 1fr 72px; align-items: center; gap: 10px; font-size: 12px; }
.nd-wf-track { height: 10px; position: relative; background: var(--raise); border-radius: 3px; }
.nd-wf-bar { position: absolute; top: 0; bottom: 0; background: var(--accent); border-radius: 3px; min-width: 2px; }
.nd-wf-row span:last-child { text-align: right; font-family: var(--mono); color: var(--muted); }

/* ---------- settings ---------- */
.nd-form { display: flex; flex-direction: column; gap: 16px; max-width: 560px; }
.nd-field { display: grid; grid-template-columns: 180px 1fr; gap: 12px; align-items: start; }
.nd-field > span:first-child { color: var(--text); font-weight: 550; padding-top: 4px; }
.nd-field p { margin: 4px 0 0; color: var(--faint); font-size: 12px; }
.nd-keys { display: grid; grid-template-columns: auto 1fr; gap: 6px 16px; align-items: center; }
kbd { font-family: var(--mono); font-size: 11px; padding: 2px 6px; border: 1px solid var(--line); border-bottom-width: 2px; border-radius: 5px; background: var(--surface); color: var(--text); }

/* ---------- toast ---------- */
.nd-toast {
  position: fixed; left: 50%; bottom: 60px; transform: translateX(-50%);
  z-index: 2147483647;
  background: var(--surface); border: 1px solid var(--line); border-radius: 8px;
  box-shadow: var(--shadow); padding: 7px 12px; font-size: 12.5px;
  max-width: calc(100vw - 24px);
}


/* ---------- shared bits (v0.2) ---------- */
.nd-brand { position: relative; }
.nd-brand > div { flex: 1; min-width: 0; }
.nd-theme-btn { width: 26px; height: 26px; flex: none; }
.nd-seg { display: inline-flex; padding: 2px; gap: 2px; border: 1px solid var(--line); border-radius: 8px; background: var(--surface); flex-wrap: wrap; }
.nd-seg button { border: 0; background: transparent; color: var(--muted); padding: 3px 9px; border-radius: 6px; cursor: pointer; font-size: 12px; white-space: nowrap; }
.nd-seg button:hover { color: var(--text); }
.nd-seg button[aria-pressed="true"] { background: var(--accent-wash); color: var(--accent-strong); }
.nd-row-action { margin-left: auto; display: inline-grid; place-items: center; width: 22px; height: 22px; border: 0; border-radius: 5px; background: transparent; color: var(--faint); cursor: pointer; opacity: 0; flex: none; }
.nd-row-action svg { width: 13px; height: 13px; }
.nd-tree-row:hover .nd-row-action, .nd-tree-row[aria-selected="true"] .nd-row-action, .nd-row-action:focus-visible { opacity: 1; }
.nd-row-action:hover { background: var(--raise); color: var(--accent-strong); }
.nd-tree-name[data-plain]::before, .nd-tree-name[data-plain]::after { content: none; }
.nd-group-head { padding: 10px 14px 4px; font-family: var(--mono); font-size: 11px; color: var(--faint); }
.nd-dot { width: 7px; height: 7px; border-radius: 50%; background: var(--good); flex: none; }
.nd-rt-server { background: var(--server-wash); color: var(--server); }
.nd-rt-client { background: var(--client-wash); color: var(--client); }
.nd-upd-major { background: color-mix(in srgb, var(--bad) 15%, transparent); color: var(--bad); }
.nd-upd-minor { background: var(--server-wash); color: var(--server); }
.nd-upd-patch { background: var(--client-wash); color: var(--client); }
.nd-kind-rsc { background: var(--accent-wash); color: var(--accent-strong); }
.nd-kind-action { background: var(--server-wash); color: var(--server); }
.nd-kind-api { background: var(--client-wash); color: var(--client); }
.nd-kind-navigation { background: transparent; color: var(--muted); border: 1px dashed var(--line); }
.nd-net tr { cursor: pointer; }
.nd-net td { padding: 6px 10px 6px 0; }
.nd-net td:first-child { padding-left: 10px; }
.nd-net tr:hover td { background: var(--raise); }
.nd-net tr[aria-selected="true"] td { background: var(--accent-wash); }
.nd-net tr[data-kind="navigation"] td { color: var(--muted); }
.nd-net-url { max-width: 0; width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.nd-json { font-family: var(--mono); font-size: 12px; border: 1px solid var(--line-soft); border-radius: 8px; padding: 6px 8px; background: var(--surface); overflow: auto; max-height: 520px; }
.nd-json-row { display: flex; align-items: center; min-height: 21px; white-space: nowrap; }
.nd-json-row .nd-tree-toggle:disabled { cursor: default; }
.nd-json-key { color: var(--accent-strong); }
.nd-json-str { color: var(--client); white-space: pre-wrap; word-break: break-all; }
.nd-json-num, .nd-json-bool { color: var(--server); }
.nd-json-fn { color: var(--muted); font-style: italic; }
.nd-pre { font-family: var(--mono); font-size: 12px; white-space: pre-wrap; word-break: break-all; background: var(--surface); border: 1px solid var(--line-soft); border-radius: 8px; padding: 8px 10px; margin: 0; max-height: 360px; overflow: auto; }
.nd-section > h3 code { font-weight: 500; }

/* ---------- overview (v0.2) ---------- */
.nd-overview { max-width: 980px; margin: 0 auto; }
.nd-ov-hero { display: flex; flex-direction: column; align-items: center; text-align: center; padding: 18px 0 22px; }
.nd-mark-lg { width: 54px; height: 54px; color: var(--text); margin-bottom: 10px; }
.nd-ov-hero h1 { margin: 0; font-size: 28px; line-height: 1.1; font-weight: 700; letter-spacing: -0.025em; }
.nd-ov-hero p { margin: 6px 0 0; color: var(--muted); font-size: 12.5px; }
.nd-tiles { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 8px; }
.nd-tile {
  display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4px;
  min-height: 108px; padding: 14px 10px; text-align: center;
  border: 1px solid var(--line-soft); border-radius: 10px; background: var(--surface); cursor: pointer;
}
.nd-tile:disabled { cursor: default; }
.nd-tile:not(:disabled):hover { border-color: var(--accent); }
.nd-tile-icon { color: var(--muted); }
.nd-tile-icon svg { width: 22px; height: 22px; }
.nd-tile-value { font-size: 20px; font-weight: 700; letter-spacing: -0.02em; font-variant-numeric: tabular-nums; }
.nd-tile-label { color: var(--muted); font-size: 12px; }
.nd-tile-note { font-size: 11px; color: var(--faint); }
.nd-tile-accent { background: var(--accent-wash); border-color: color-mix(in srgb, var(--accent) 40%, transparent); }
.nd-tile-accent .nd-tile-icon, .nd-tile-accent .nd-tile-value { color: var(--accent-strong); }
.nd-tile-accent .nd-tile-note { color: var(--accent); }
.nd-ov-cols { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 0 32px; margin-top: 22px; }
.nd-ov-cols .nd-section { margin-top: 0; margin-bottom: 18px; }
.nd-ov-links { display: flex; flex-wrap: wrap; justify-content: center; gap: 8px 22px; padding: 14px 0 4px; border-top: 1px solid var(--line-soft); margin-top: 6px; }

/* ---------- narrow screens ---------- */
@media (max-width: 720px) {
  .nd-panel { left: 0; right: 0; bottom: 0; border-radius: 12px 12px 0 0; grid-template-columns: 1fr; grid-template-rows: auto 1fr; }
  .nd-rail { flex-direction: row; padding: 6px; border-right: 0; border-bottom: 1px solid var(--line-soft); overflow-x: auto; }
  .nd-brand, .nd-rail-spacer { display: none; }
  .nd-tab { width: auto; flex: none; }
  .nd-tab span { display: none; }
  .nd-split { grid-template-columns: 1fr; grid-template-rows: 3fr 2fr; }
  .nd-pane + .nd-pane { border-left: 0; border-top: 1px solid var(--line-soft); }
  .nd-field { grid-template-columns: 1fr; gap: 4px; }
  .nd-body { padding: 14px 14px 20px; }
}
`;
