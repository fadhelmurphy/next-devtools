"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/loader/index.ts
var loader_exports = {};
__export(loader_exports, {
  default: () => loader_default
});
module.exports = __toCommonJS(loader_exports);
var import_node_path = __toESM(require("path"), 1);

// src/loader/transform.ts
var import_parser = require("@babel/parser");
var import_magic_string = __toESM(require("magic-string"), 1);

// src/shared/types.ts
var SOURCE_ATTR = "data-nd-src";

// src/loader/transform.ts
var SKIP_TAGS = /* @__PURE__ */ new Set([
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
  "slot"
]);
function pluginsFor(file) {
  if (/\.tsx$/.test(file)) return ["jsx", "typescript", "decorators-legacy"];
  if (/\.(jsx|js|mjs|cjs)$/.test(file)) return ["jsx", "decorators-legacy"];
  return null;
}
function injectSourceAttributes(source, opts) {
  const plugins = pluginsFor(opts.relativePath);
  if (!plugins || !/<[a-z]/.test(source)) return { code: source, count: 0 };
  let ast;
  try {
    ast = (0, import_parser.parse)(source, {
      sourceType: "unambiguous",
      plugins,
      errorRecovery: true,
      allowReturnOutsideFunction: true,
      allowImportExportEverywhere: true
    });
  } catch {
    return { code: source, count: 0 };
  }
  const attr = opts.attribute ?? SOURCE_ATTR;
  const file = opts.relativePath.replace(/\\/g, "/").replace(/"/g, "");
  const s = new import_magic_string.default(source);
  let count = 0;
  const visit = (node) => {
    if (!node || typeof node.type !== "string") return;
    if (node.type === "JSXOpeningElement" && node.name?.type === "JSXIdentifier") {
      const tag = node.name.name;
      if (/^[a-z]/.test(tag) && !SKIP_TAGS.has(tag)) {
        const already = node.attributes.some(
          (a) => a.type === "JSXAttribute" && a.name?.name === attr
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
    map: opts.sourceMap ? s.generateMap({ source: file, includeContent: true, hires: true }) : void 0,
    count
  };
}

// src/loader/index.ts
function nextDevtoolsLoader(source, inputMap) {
  this.cacheable?.(true);
  const file = this.resourcePath;
  if (!file || /[\\/]node_modules[\\/]/.test(file) || /[\\/]\.next[\\/]/.test(file)) {
    return this.callback(null, source, inputMap);
  }
  let options = {};
  try {
    options = this.getOptions?.() ?? (typeof this.query === "object" && this.query ? this.query : {});
  } catch {
    options = {};
  }
  const root = options.root || this.rootContext || process.cwd();
  const relativePath = import_node_path.default.relative(root, file).split(import_node_path.default.sep).join("/");
  try {
    const result = injectSourceAttributes(source, {
      relativePath,
      sourceMap: this.sourceMap !== false && !inputMap
    });
    if (!result.count) return this.callback(null, source, inputMap);
    return this.callback(null, result.code, result.map ?? inputMap);
  } catch {
    return this.callback(null, source, inputMap);
  }
}
var loader_default = nextDevtoolsLoader;
if (module.exports && module.exports.default) { const l = module.exports.default; module.exports = l; module.exports.default = l; }
