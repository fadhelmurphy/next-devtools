import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterAll, describe, expect, it } from "vitest";
import { scanRoutes } from "../src/config/routes";
import { resolveInsideRoot } from "../src/config/server";

const root = fs.mkdtempSync(path.join(os.tmpdir(), "nd-routes-"));
const touch = (f: string) => {
  fs.mkdirSync(path.dirname(path.join(root, f)), { recursive: true });
  fs.writeFileSync(path.join(root, f), "");
};

[
  "src/app/layout.tsx",
  "src/app/page.tsx",
  "src/app/(marketing)/about/page.tsx",
  "src/app/blog/layout.tsx",
  "src/app/blog/[slug]/page.tsx",
  "src/app/docs/[[...path]]/page.mdx",
  "src/app/shop/[...all]/page.tsx",
  "src/app/api/hello/route.ts",
  "src/app/_lib/page.tsx",
  "src/app/@modal/(.)photo/[id]/page.tsx",
  "src/pages/_app.tsx",
  "src/pages/index.tsx",
  "src/pages/legacy/[id].tsx",
  "src/pages/api/users.ts",
].forEach(touch);

afterAll(() => fs.rmSync(root, { recursive: true, force: true }));

describe("scanRoutes", () => {
  const routes = scanRoutes(root, ["tsx", "ts", "jsx", "js", "mdx"]);
  const find = (route: string, router: string) => routes.find((r) => r.route === route && r.router === router);

  it("finds app router pages, groups, dynamic and catch-all segments", () => {
    expect(find("/", "app")?.file).toBe("src/app/page.tsx");
    expect(find("/about", "app")).toBeTruthy();
    expect(find("/blog/[slug]", "app")).toMatchObject({ params: ["slug"], layouts: ["src/app/layout.tsx", "src/app/blog/layout.tsx"] });
    expect(find("/docs/[[...path]]", "app")).toMatchObject({ optionalCatchAll: true });
    expect(find("/shop/[...all]", "app")).toMatchObject({ catchAll: true });
    expect(find("/api/hello", "app")?.kind).toBe("api");
    expect(find("/photo/[id]", "app")).toMatchObject({ slot: "@modal", intercepting: true });
  });

  it("skips private folders and Pages Router special files", () => {
    expect(routes.some((r) => r.file.includes("_lib"))).toBe(false);
    expect(routes.some((r) => r.file.endsWith("_app.tsx"))).toBe(false);
  });

  it("finds pages router routes", () => {
    expect(find("/", "pages")).toBeTruthy();
    expect(find("/legacy/[id]", "pages")?.params).toEqual(["id"]);
    expect(find("/api/users", "pages")?.kind).toBe("api");
  });
});

describe("resolveInsideRoot", () => {
  it("rejects paths outside the project", () => {
    expect(resolveInsideRoot("/proj", "src/a.tsx")).toBe(path.resolve("/proj/src/a.tsx"));
    expect(resolveInsideRoot("/proj", "../etc/passwd")).toBeNull();
    expect(resolveInsideRoot("/proj", "/etc/passwd")).toBeNull();
  });
});
