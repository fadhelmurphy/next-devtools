import type { AppProps } from "next/app";
import Link from "next/link";
import { NextDevtools } from "@fadhelmurphy/next-devtools/client";
import "../styles/globals.css";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <header className="site-header">
        <Link href="/">Home</Link>
        <Link href="/about">About</Link>
        <Link href="/posts/hello-world">Post</Link>
      </header>
      <main>
        <Component {...pageProps} />
      </main>
      <NextDevtools />
    </>
  );
}
