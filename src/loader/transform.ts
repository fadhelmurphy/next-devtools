import { parse, type ParserPlugin } from "@babel/parser";
import MagicString from "magic-string";
import { SOURCE_ATTR } from "../shared/types";

/**
 * Host elements we never tag: they live outside the visible page, can't carry
 * arbitrary attributes safely, or would only add noise.
 */
const SKIP_TAGS = new Set([
  "html",
  "head",
  "script",
  "style",
  "meta",
  "link",
  "title",
  "base",
  "noscript",
  "template",
  "slot",
]);

export interface TransformOptions {
  /** Path written into the attribute (already relative to the project root). */
  relativePath: string;
  /** Produce a source map (webpack/Turbopack chain it with SWC's). */
  sourceMap?: boolean;
  attribute?: string;
}

export interface TransformResult {
  code: string;
  map?: ReturnType<MagicString["generateMap"]>;
  /** Number of elements tagged — 0 means the input was returned as-is. */
  count: number;
}

function pluginsFor(file: string): ParserPlugin[] | null {
  if (/\.tsx$/.test(file)) return ["jsx", "typescript", "decorators-legacy"];
  if (/\.(jsx|js|mjs|cjs)$/.test(file)) return ["jsx", "decorators-legacy"];
  // .ts can't contain JSX (`<T>x` is a type assertion there)
  return null;
}

/**
 * Adds `data-nd-src="file:line:col"` to every lowercase (host) JSX element.
 * Components (`<Button>`, `<motion.div>`) are left untouched so we never leak
 * unknown props into user components; the inspector maps a DOM node back to
 * its component through React's fiber instead.
 */
export function injectSourceAttributes(source: string, opts: TransformOptions): TransformResult {
  const plugins = pluginsFor(opts.relativePath);
  // Cheap pre-check: no JSX-looking `<x` at all → nothing to do.
  if (!plugins || !/<[a-z]/.test(source)) return { code: source, count: 0 };

  let ast: ReturnType<typeof parse>;
  try {
    ast = parse(source, {
      sourceType: "unambiguous",
      plugins,
      errorRecovery: true,
      allowReturnOutsideFunction: true,
      allowImportExportEverywhere: true,
    });
  } catch {
    // Let the real compiler report syntax errors with a proper message.
    return { code: source, count: 0 };
  }

  const attr = opts.attribute ?? SOURCE_ATTR;
  const file = opts.relativePath.replace(/\\/g, "/").replace(/"/g, "");
  const s = new MagicString(source);
  let count = 0;

  const visit = (node: any): void => {
    if (!node || typeof node.type !== "string") return;

    if (node.type === "JSXOpeningElement" && node.name?.type === "JSXIdentifier") {
      const tag: string = node.name.name;
      if (/^[a-z]/.test(tag) && !SKIP_TAGS.has(tag)) {
        const already = node.attributes.some(
          (a: any) => a.type === "JSXAttribute" && a.name?.name === attr,
        );
        if (!already && node.loc && typeof node.name.end === "number") {
          const { line, column } = node.loc.start;
          s.appendLeft(node.name.end, ` ${attr}="${file}:${line}:${column + 1}"`);
          count++;
        }
      }
    }

    for (const key in node) {
      if (key === "loc" || key === "leadingComments" || key === "trailingComments" || key === "extra") continue;
      const child = node[key];
      if (Array.isArray(child)) {
        for (const c of child) if (c && typeof c === "object") visit(c);
      } else if (child && typeof child === "object" && typeof child.type === "string") {
        visit(child);
      }
    }
  };

  visit(ast.program);

  if (!count) return { code: source, count: 0 };
  return {
    code: s.toString(),
    map: opts.sourceMap ? s.generateMap({ source: file, includeContent: true, hires: true }) : undefined,
    count,
  };
}
