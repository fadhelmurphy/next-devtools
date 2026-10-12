import { type SourceLocation } from "./api.js";
export type Fiber = any;
export type ServerInfo = {
    name: string;
    env?: string;
    key?: string | null;
    props?: Record<string, unknown>;
};
export declare const HOST_ID = "next-devtools-host";
export declare const isInternalName: (name: string) => boolean;
export declare function getFiberFromNode(node: Node | null): Fiber | null;
/** Current HostRoot fibers of every React root on the page (except our own panel). */
export declare function findRoots(): Fiber[];
export declare function getDisplayName(fiber: Fiber): string;
export declare const isComponentFiber: (f: Fiber) => any;
export declare function idOf(obj: object): number;
export interface TreeNode {
    id: number;
    name: string;
    kind: "client" | "server";
    env?: string;
    key?: string | null;
    /** Client: the component fiber. Server: the fibers it rendered. */
    fibers: Fiber[];
    info?: ServerInfo;
    children: TreeNode[];
}
export interface BuildOptions {
    hideInternals: boolean;
}
/** Next's own error overlay is portaled into <nextjs-portal>; never part of "your" tree. */
export declare function isNextOverlay(f: Fiber): boolean;
export declare function buildTree(opts: BuildOptions): TreeNode[];
export declare function walkTree(nodes: TreeNode[], fn: (n: TreeNode, parents: TreeNode[]) => void, parents?: TreeNode[]): void;
export declare function hostNodesOf(fiber: Fiber, out?: Element[], depth?: number): Element[];
export declare function nodeElements(node: TreeNode): Element[];
/** Where in the source a component's own JSX lives: a host element it rendered directly. */
export declare function sourceOfNode(node: TreeNode): SourceLocation | null;
/** The component (client fiber or server info) that rendered a DOM element. */
export declare function ownerOfElement(el: Element): {
    name: string;
    server: boolean;
    owner: Fiber | ServerInfo;
} | null;
export declare function preview(value: unknown, depth?: number, seen?: WeakSet<object>): string;
export declare function propsOf(node: TreeNode): Record<string, unknown>;
/** useState / useReducer values (function components) or this.state (classes). */
export declare function stateOf(node: TreeNode): unknown[];
type CommitListener = (root: any) => void;
export declare function subscribeCommits(fn: CommitListener): () => void;
export declare const hasCommitHook: () => boolean;
/** Is this fiber root one of ours (the DevTools panel) or Next's dev overlay? */
export declare function isForeignRoot(root: any): boolean;
/** Calls `fn` (throttled) after the app commits; falls back to polling without the DevTools hook. */
export declare function onCommit(fn: () => void, interval?: number): () => void;
export {};
