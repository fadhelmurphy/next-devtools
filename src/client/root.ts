import type { ReactElement } from "react";
import { createRoot } from "react-dom/client";

/** React 18+: concurrent root. On React 17 the build swaps this file for root-legacy. */
export function renderRoot(element: ReactElement, container: Element): () => void {
  const root = createRoot(container);
  root.render(element);
  return () => root.unmount();
}
