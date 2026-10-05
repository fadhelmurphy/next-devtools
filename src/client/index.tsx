"use client";

import { useEffect } from "react";

export interface NextDevtoolsProps {
  /** Force it on/off. Defaults to on in `next dev`, always off in production builds. */
  enabled?: boolean;
}

/**
 * Drop this once into your root layout (App Router) or `_app` (Pages Router):
 *
 * ```tsx
 * import { NextDevtools } from "@fadhelmurphy/next-devtools/client";
 * <body>{children}<NextDevtools /></body>
 * ```
 *
 * Renders nothing on the server. In production builds the panel code is
 * dead-code-eliminated, so it costs nothing.
 */
export function NextDevtools({ enabled = true }: NextDevtoolsProps) {
  useEffect(() => {
    // Written as a single `if` so bundlers drop the import() in production.
    if (process.env.NODE_ENV === "development") {
      if (!enabled) return;
      let unmount: (() => void) | undefined;
      let cancelled = false;
      import("./mount.js").then((m) => {
        if (!cancelled) unmount = m.mount();
      });
      return () => {
        cancelled = true;
        unmount?.();
      };
    }
  }, [enabled]);
  return null;
}

export default NextDevtools;
