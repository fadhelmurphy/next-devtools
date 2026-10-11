import type { ReactNode } from "react";
import Link from "next/link";
import { NextDevtools } from "@fadhelmurphy/next-devtools/client";
import "./globals.css";

export const metadata = { title: "Next DevTools example" };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <header className="site-header">
          <Link href="/">Home</Link>
          <Link href="/about">About</Link>
          <Link href="/blog/hello-world">Blog post</Link>
        </header>
        <main>{children}</main>
        <NextDevtools />
      </body>
    </html>
  );
}
