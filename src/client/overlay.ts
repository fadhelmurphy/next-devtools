import { SOURCE_ATTR } from "../shared/types.js";
import { parseSource, type SourceLocation } from "./api.js";
import { HOST_ID, ownerOfElement } from "./fiber.js";

/* Highlight box + tooltip drawn inside our shadow root. Plain DOM on purpose:
   pointermove fires constantly and must not re-render React. */

let layer: HTMLElement | null = null;
let box: HTMLElement | null = null;
let tip: HTMLElement | null = null;

export function attachOverlay(container: HTMLElement) {
  layer = document.createElement("div");
  layer.className = "nd-layer";
  box = document.createElement("div");
  box.className = "nd-box";
  tip = document.createElement("div");
  tip.className = "nd-tip";
  layer.append(box, tip);
  container.appendChild(layer);
  hideHighlight();
}

function unionRect(elements: Element[]): DOMRect | null {
  let l = Infinity, t = Infinity, r = -Infinity, b = -Infinity;
  for (const el of elements) {
    const rect = el.getBoundingClientRect();
    if (!rect.width && !rect.height) continue;
    l = Math.min(l, rect.left);
    t = Math.min(t, rect.top);
    r = Math.max(r, rect.right);
    b = Math.max(b, rect.bottom);
  }
  return l === Infinity ? null : new DOMRect(l, t, r - l, b - t);
}

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);

export interface HighlightLabel {
  title: string;
  server?: boolean;
  tag?: string;
  source?: SourceLocation | null;
  hint?: string;
}

export function highlight(elements: Element[], label?: HighlightLabel) {
  if (!box || !tip) return;
  const rect = unionRect(elements);
  if (!rect) return hideHighlight();
  Object.assign(box.style, {
    display: "block",
    left: `${rect.left}px`,
    top: `${rect.top}px`,
    width: `${rect.width}px`,
    height: `${rect.height}px`,
  });
  if (!label) {
    tip.style.display = "none";
    return;
  }
  tip.innerHTML = `
    <div class="nd-tip-head">
      <span class="nd-tip-name">${esc(label.title)}</span>
      ${label.server ? `<span class="nd-badge nd-badge-server">Server</span>` : ""}
      ${label.tag ? `<span class="nd-tip-tag">&lt;${esc(label.tag)}&gt;</span>` : ""}
    </div>
    ${label.source ? `<div class="nd-tip-src">${esc(label.source.file)}:${label.source.line}</div>` : ""}
    <div class="nd-tip-foot"><span>${Math.round(rect.width)} × ${Math.round(rect.height)}</span>${label.hint ? `<span>${esc(label.hint)}</span>` : ""}</div>`;
  tip.style.display = "block";
  // Below the box if there's room, otherwise above; clamp horizontally.
  const tw = tip.offsetWidth, th = tip.offsetHeight;
  let top = rect.bottom + 6;
  if (top + th > window.innerHeight - 4) top = rect.top - th - 6;
  if (top < 4) top = Math.min(window.innerHeight - th - 4, Math.max(4, rect.top + 6));
  const left = Math.min(Math.max(4, rect.left), window.innerWidth - tw - 4);
  tip.style.top = `${top}px`;
  tip.style.left = `${left}px`;
}

export function hideHighlight() {
  if (box) box.style.display = "none";
  if (tip) tip.style.display = "none";
}

// ---- inspector mode -----------------------------------------------------------
export type InspectorMode = "editor" | "select";
export interface PickResult {
  element: Element;
  source: SourceLocation | null;
}

let active: { mode: InspectorMode; onPick: (r: PickResult) => void; onExit: () => void } | null = null;
let last: Element | null = null;

const isOurs = (e: Event) => e.composedPath().some((n) => (n as Element).id === HOST_ID);

function targetOf(e: Event): Element | null {
  const t = e.composedPath()[0];
  return t instanceof Element ? t : (t as Node)?.parentElement ?? null;
}

export function describe(el: Element): HighlightLabel & { source: SourceLocation | null } {
  const tagged = el.closest(`[${SOURCE_ATTR}]`);
  const source = parseSource(tagged?.getAttribute(SOURCE_ATTR));
  const owner = ownerOfElement(el);
  return {
    title: owner?.name ?? el.tagName.toLowerCase(),
    server: owner?.server,
    tag: el.tagName.toLowerCase(),
    source,
  };
}

const onMove = (e: PointerEvent) => {
  if (!active || isOurs(e)) return;
  const el = targetOf(e);
  if (!el || el === last) return;
  last = el;
  const d = describe(el);
  highlight([el], {
    ...d,
    hint: active.mode === "editor" ? (d.source ? "Click to open in editor" : "No source for this element") : "Click to select",
  });
};

const swallow = (e: Event) => {
  if (!active || isOurs(e)) return;
  e.preventDefault();
  e.stopPropagation();
  e.stopImmediatePropagation();
};

const onClick = (e: MouseEvent) => {
  if (!active || isOurs(e)) return;
  swallow(e);
  const el = targetOf(e);
  if (!el) return;
  const { onPick } = active;
  const keep = e.shiftKey; // Shift+click: pick and stay in inspector mode
  if (!keep) stopInspector();
  onPick({ element: el, source: describe(el).source });
};

const onKey = (e: KeyboardEvent) => {
  if (active && e.key === "Escape") {
    e.preventDefault();
    stopInspector();
  }
};

const onScroll = () => {
  if (active && last) highlight([last], describe(last));
};

export function startInspector(mode: InspectorMode, onPick: (r: PickResult) => void, onExit: () => void) {
  if (active) stopInspector();
  active = { mode, onPick, onExit };
  last = null;
  window.addEventListener("pointermove", onMove, true);
  window.addEventListener("click", onClick, true);
  for (const t of ["pointerdown", "pointerup", "mousedown", "mouseup", "dblclick", "contextmenu"]) {
    window.addEventListener(t, swallow, true);
  }
  window.addEventListener("keydown", onKey, true);
  window.addEventListener("scroll", onScroll, true);
  document.documentElement.style.cursor = "crosshair";
}

export function stopInspector() {
  if (!active) return;
  const { onExit } = active;
  active = null;
  last = null;
  window.removeEventListener("pointermove", onMove, true);
  window.removeEventListener("click", onClick, true);
  for (const t of ["pointerdown", "pointerup", "mousedown", "mouseup", "dblclick", "contextmenu"]) {
    window.removeEventListener(t, swallow, true);
  }
  window.removeEventListener("keydown", onKey, true);
  window.removeEventListener("scroll", onScroll, true);
  document.documentElement.style.cursor = "";
  hideHighlight();
  onExit();
}

export const inspectorActive = () => !!active;
