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
export declare function NextDevtools({ enabled }: NextDevtoolsProps): null;
export default NextDevtools;
