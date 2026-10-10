"use client";
import { useEffect } from "react";
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
export function NextDevtools({ enabled = true }) {
    useEffect(() => {
        // Written as a single `if` so bundlers drop the import() in production.
        if (process.env.NODE_ENV === "development") {
            if (!enabled)
                return;
            let unmount;
            let cancelled = false;
            import("./mount.js").then((m) => {
                if (!cancelled)
                    unmount = m.mount();
            });
            return () => {
                cancelled = true;
                unmount === null || unmount === void 0 ? void 0 : unmount();
            };
        }
    }, [enabled]);
    return null;
}
export default NextDevtools;
