import type { RouteEntry } from "../shared/types.js";
/** The page route serving `pathname`, preferring static over dynamic like Next does. */
export declare function matchRoute(routes: RouteEntry[], pathname: string): RouteEntry | undefined;
export declare function fillRoute(route: string, values: Record<string, string>): string;
/** Client-side navigation through Next's router when it's exposed, else a full load. */
export declare function navigate(url: string): void;
/** Extract dynamic params of `route` from `pathname`, e.g. /blog/[slug] + /blog/hi → { slug: "hi" }. */
export declare function extractParams(route: string, pathname: string): Record<string, string | string[]>;
