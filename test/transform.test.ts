import { describe, expect, it } from "vitest";
import { injectSourceAttributes } from "../src/loader/transform";

const run = (code: string, file = "app/page.tsx") => injectSourceAttributes(code, { relativePath: file }).code;

describe("injectSourceAttributes", () => {
  it("tags host elements with file:line:col", () => {
    const out = run(`export default function Page() {\n  return <main className="x">\n    <h1>Hi</h1>\n  </main>;\n}`);
    expect(out).toContain(`<main data-nd-src="app/page.tsx:2:10" className="x">`);
    expect(out).toContain(`<h1 data-nd-src="app/page.tsx:3:5">`);
  });

  it("leaves components, member expressions and fragments alone", () => {
    const out = run(`const A = () => <><Button /><motion.div /><Foo.Bar x /></>;`);
    expect(out).not.toContain("data-nd-src");
  });

  it("handles self-closing, spread and existing attribute", () => {
    const out = run(`const A = (p) => <div><img {...p} /><span data-nd-src="keep" /></div>;`, "src/a.jsx");
    expect(out).toContain(`<img data-nd-src="src/a.jsx:1:23" {...p} />`);
    expect(out).toContain(`<span data-nd-src="keep" />`);
  });

  it("skips html/head/script but tags body", () => {
    const out = run(`export default ({children}) => <html><head><title>x</title></head><body>{children}</body></html>;`);
    expect(out).not.toMatch(/<html data-nd-src/);
    expect(out).not.toMatch(/<head data-nd-src/);
    expect(out).toMatch(/<body data-nd-src/);
  });

  it("parses TypeScript generics, satisfies and type assertions in tsx", () => {
    const code = `type P = { a: string };\nconst f = <T,>(x: T) => x;\nexport const C = (p: P) => <p>{(p.a as string) satisfies string}</p>;`;
    expect(run(code, "components/C.tsx")).toContain(`<p data-nd-src="components/C.tsx:3:28">`);
  });

  it("ignores .ts files and invalid syntax", () => {
    expect(run(`const x = <any>y;`, "lib/x.ts")).toBe(`const x = <any>y;`);
    const broken = `export default () => <div>`;
    expect(() => run(broken)).not.toThrow();
  });

  it("returns a source map when asked", () => {
    const r = injectSourceAttributes(`const a = <div />;`, { relativePath: "a.jsx", sourceMap: true });
    expect(r.map?.mappings).toBeTruthy();
    expect(r.count).toBe(1);
  });
});
