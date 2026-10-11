# Examples

One small app per Next.js major version, each wired up with Next DevTools the way you'd do it in a real project. They all have the same pages so you can compare: a home page with client state, a dynamic route, an API route and a static asset.

| Example | Next.js | React | Router | Config | Node to run it |
|---|---|---|---|---|---|
| [next-10](next-10) | 10.2 | 17 | Pages | `next.config.js` | 14 or 16 (`npm run dev:node17` on 17+) |
| [next-11](next-11) | 11.1 | 17 | Pages | `next.config.js` | 14 or 16 (`npm run dev:node17` on 17+) |
| [next-12](next-12) | 12.3 | 17 | Pages | `next.config.js` | 14+ (`npm run dev:node17` on 17+) |
| [next-13](next-13) | 13.5 | 18 | App | `next.config.js` | 16.14+ |
| [next-14](next-14) | 14.2 | 18 | App | `next.config.mjs` | 18.17+ |
| [next-15](next-15) | 15.5 | 19 | App | `next.config.ts` | 18.18+ |
| [next-16](next-16) | 16 | 19 | App | `next.config.ts` | 20.9+ |
| [next-16-pages](next-16-pages) | 16 | 19 | Pages | `next.config.mjs` | 20.9+ |

The Pages Router examples have `getServerSideProps` (`/posts/[id]`) and `getStaticProps` (`/about`) pages; the App Router ones have Server Components, a client component with state, a Server Action and a route handler.

## Run one

Build the package once from the repo root, then start an example:

```bash
npm install --include=dev && npm run build   # in the repo root
cd examples/next-12
npm install
npm run dev
```

Open http://localhost:3000 and press **Shift + Alt + D**. Each example installs the package from `../..` as a copy (`install-links=true` in `.npmrc`), so run `npm install` again in the example after rebuilding.

`npm run dev:turbo` starts the App Router examples with Turbopack (Next 14+).

## Notes for old versions

- **`ERR_OSSL_EVP_UNSUPPORTED`** on Next 10–12: webpack's hashing needs the legacy OpenSSL provider on Node 17+. Use `npm run dev:node17` / `npm run build:node17`, or Node 16.
- **npm 6** (the default on Node 14) links `file:` dependencies instead of copying them. Use npm 7+ (`npx npm@8 install`) or install a tarball: `npm pack` in the repo root, then `npm install --no-save ../../fadhelmurphy-next-devtools-*.tgz` in the example.
- **Next 13**: Server Components don't appear in the component tree (React 18 doesn't record them). Inspecting their elements still shows the file and line.
- **Next 14 with `--turbo`**: only `.jsx` files get file/line info; the default webpack dev server tags everything.
