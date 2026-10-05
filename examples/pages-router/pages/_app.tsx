import type { AppProps } from "next/app";
import Link from "next/link";
import { NextDevtools } from "@fadhelmurphy/next-devtools/client";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <nav style={{ display: "flex", gap: 16, padding: 16, borderBottom: "1px solid #eee" }}>
        <Link href="/">Home</Link>
        <Link href="/posts/1">Post 1</Link>
      </nav>
      <main style={{ padding: 24, fontFamily: "system-ui" }}>
        <Component {...pageProps} />
      </main>
      <NextDevtools />
    </>
  );
}
