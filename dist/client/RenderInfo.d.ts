import type { TreeNode } from "./fiber.js";
import { type RenderStat } from "./profiler.js";
/** Re-render when new render data arrives (throttled in the profiler). */
export declare function useProfileVersion(): number;
export declare function Sparkline({ values }: {
    values: number[];
}): import("react").JSX.Element;
/** The latest stat for any fiber of a client tree node. */
export declare function statForNode(node: TreeNode): RenderStat | undefined;
export declare function RenderInfo({ node }: {
    node: TreeNode;
}): import("react").JSX.Element;
/** Compact "0.42 ms" for tree rows. */
export declare function RenderBadge({ node }: {
    node: TreeNode;
}): import("react").JSX.Element | null;
