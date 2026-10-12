import fs from "node:fs";
import { parse, type ParserPlugin } from "@babel/parser";

export interface ComponentRange {
  name?: string;
  start: number;
  end: number;
}

interface Candidate extends ComponentRange {
  depth: number;
  isDefault: boolean;
}

function pluginsFor(file: string): ParserPlugin[] {
  return /\.tsx?$/.test(file) ? ["jsx", "typescript", "decorators-legacy"] : ["jsx", "flow", "decorators-legacy"];
}

const isComponentName = (n?: string) => !!n && /^[A-Z]/.test(n);

/** memo(() => …), forwardRef(function X() …), React.memo(observer(…)) → the inner function node. */
function unwrapCall(node: any): any {
  let n = node;
  for (let i = 0; i < 4 && n?.type === "CallExpression"; i++) {
    const fn = n.arguments?.find((a: any) => /Function|ArrowFunction|CallExpression/.test(a?.type));
    if (!fn) return null;
    n = fn;
  }
  return n && /FunctionExpression|ArrowFunctionExpression/.test(n.type) ? n : null;
}

/** Every function/class that could be a React component, with its line range. */
export function findComponentCandidates(code: string, file: string): Candidate[] {
  let ast: any;
  try {
    ast = parse(code, { sourceType: "unambiguous", plugins: pluginsFor(file), errorRecovery: true });
  } catch {
    return [];
  }
  const out: Candidate[] = [];
  const add = (name: string | undefined, node: any, depth: number, isDefault = false) => {
    if (!node?.loc) return;
    out.push({ name, start: node.loc.start.line, end: node.loc.end.line, depth, isDefault });
  };

  const visit = (node: any, depth: number, parentDefault = false) => {
    if (!node || typeof node.type !== "string") return;
    switch (node.type) {
      case "ExportDefaultDeclaration": {
        const d = node.declaration;
        if (d?.type === "FunctionDeclaration" || d?.type === "ClassDeclaration") add(d.id?.name, node, depth, true);
        else if (/FunctionExpression|ArrowFunctionExpression/.test(d?.type) || unwrapCall(d)) add(undefined, node, depth, true);
        break;
      }
      case "FunctionDeclaration":
      case "ClassDeclaration":
        if (!parentDefault) add(node.id?.name, node, depth);
        break;
      case "VariableDeclarator": {
        const init = node.init;
        if (init && (/FunctionExpression|ArrowFunctionExpression|ClassExpression/.test(init.type) || unwrapCall(init))) {
          // the whole `const X = …` statement, so the range covers the declaration line
          add(node.id?.name, node, depth);
        }
        break;
      }
    }
    for (const key in node) {
      if (key === "loc" || key === "leadingComments" || key === "trailingComments" || key === "extra") continue;
      const child = node[key];
      const isDefault = node.type === "ExportDefaultDeclaration";
      if (Array.isArray(child)) child.forEach((c) => c && typeof c === "object" && visit(c, depth + 1, isDefault));
      else if (child && typeof child === "object" && typeof child.type === "string") visit(child, depth + 1, isDefault);
    }
  };
  visit(ast.program, 0);
  return out;
}

/**
 * The declaration a component lives in: the one named `name` (if given and found),
 * else the innermost component-like declaration around `line`, else the default export.
 */
export function pickComponentRange(candidates: Candidate[], line?: number, name?: string): ComponentRange | undefined {
  const contains = (c: Candidate) => line != null && c.start <= line && line <= c.end;
  const byName = name ? candidates.filter((c) => c.name === name) : [];
  if (byName.length) {
    const hit = byName.find(contains) ?? byName[0];
    return { name: hit.name, start: hit.start, end: hit.end };
  }
  if (line != null) {
    const around = candidates.filter(contains);
    // Innermost upper-case declaration; fall back to the innermost of anything.
    const pick = [...around].sort((a, b) => b.depth - a.depth).find((c) => isComponentName(c.name) || c.isDefault) ?? around.sort((a, b) => b.depth - a.depth)[0];
    if (pick) return { name: pick.name ?? name, start: pick.start, end: pick.end };
  }
  const def = candidates.find((c) => c.isDefault);
  return def ? { name: def.name ?? name, start: def.start, end: def.end } : undefined;
}

export function componentRange(abs: string, line?: number, name?: string): ComponentRange | undefined {
  let code: string;
  try {
    code = fs.readFileSync(abs, "utf8");
  } catch {
    return undefined;
  }
  return pickComponentRange(findComponentCandidates(code, abs), line, name);
}
