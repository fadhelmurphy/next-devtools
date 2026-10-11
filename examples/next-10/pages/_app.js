import Link from "next/link";
import { NextDevtools } from "@fadhelmurphy/next-devtools/client";
import "../styles/globals.css";

export default function App({ Component, pageProps }) {
  return (
    <>
      <header className="site-header">
        <Link href="/"><a>Home</a></Link>
        <Link href="/about"><a>About</a></Link>
        <Link href="/posts/hello-world"><a>Post</a></Link>
      </header>
      <main>
        <Component {...pageProps} />
      </main>
      <NextDevtools />
    </>
  );
}
