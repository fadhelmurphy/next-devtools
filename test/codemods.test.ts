import { describe, expect, it } from "vitest";
import { addToPagesApp, addToRootLayout, wrapNextConfig } from "../src/cli/codemods";

describe("wrapNextConfig", () => {
  it("wraps an ESM/TS default export and adds the import after existing imports", () => {
    const src = `import type { NextConfig } from "next";\n\nconst nextConfig: NextConfig = {\n  reactStrictMode: true,\n};\n\nexport default nextConfig;\n`;
    const r = wrapNextConfig(src, "next.config.ts");
    expect(r.status).toBe("updated");
    expect(r.code).toContain(`import type { NextConfig } from "next";\nimport { withNextDevtools } from "@fadhelmurphy/next-devtools";`);
    expect(r.code).toContain("export default withNextDevtools(nextConfig);");
  });

  it("wraps an inline object and CommonJS configs", () => {
    expect(wrapNextConfig(`export default { a: 1 };`, "next.config.mjs").code).toContain("export default withNextDevtools({ a: 1 });");
    const cjs = wrapNextConfig(`/** @type {import('next').NextConfig} */\nconst c = {};\nmodule.exports = c;\n`, "next.config.js");
    expect(cjs.code).toMatch(/^const \{ withNextDevtools \} = require\("@fadhelmurphy\/next-devtools"\);/);
    expect(cjs.code).toContain("module.exports = withNextDevtools(c);");
  });

  it("is idempotent", () => {
    const once = wrapNextConfig(`export default {};`, "next.config.mjs").code;
    expect(wrapNextConfig(once, "next.config.mjs").status).toBe("already");
  });
});

describe("addToRootLayout", () => {
  it("inserts before </body> with matching indentation", () => {
    const src = `import "./globals.css";\n\nexport default function RootLayout({ children }) {\n  return (\n    <html lang="en">\n      <body>\n        {children}\n      </body>\n    </html>\n  );\n}\n`;
    const r = addToRootLayout(src);
    expect(r.code).toContain(`        {children}\n        <NextDevtools />\n      </body>`);
    expect(r.code).toContain(`import "./globals.css";\nimport { NextDevtools } from "@fadhelmurphy/next-devtools/client";`);
    expect(addToRootLayout(r.code).status).toBe("already");
  });

  it("handles a one-line body and reports when there is none", () => {
    expect(addToRootLayout(`export default ({c}) => <html><body>{c}</body></html>;`).code).toContain(`{c}<NextDevtools /></body>`);
    expect(addToRootLayout(`export default ({c}) => c;`).status).toBe("manual");
  });
});

describe("addToPagesApp", () => {
  it("renders the panel next to the page component", () => {
    const src = `import type { AppProps } from "next/app";\nexport default function App({ Component, pageProps }: AppProps) {\n  return <Component {...pageProps} />;\n}\n`;
    const r = addToPagesApp(src);
    expect(r.code).toContain(`return <><Component {...pageProps} /><NextDevtools /></>;`);
    expect(addToPagesApp(r.code).status).toBe("already");
  });
});
