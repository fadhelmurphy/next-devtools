#!/usr/bin/env bash
# Create a minimal Pages Router app for a given Next.js version.
# usage: scripts/compat-app.sh <dir> <next-version> <react-version> <package.tgz>
# Used by CI to check Next.js 10+ compatibility.
set -e
DIR=$1; NEXT=$2; REACT=$3; TGZ=$4
rm -rf "$DIR"; mkdir -p "$DIR/pages/posts" "$DIR/pages/api" "$DIR/components" "$DIR/public"
cd "$DIR"
cat > package.json <<EOF
{
  "name": "compat-next-$NEXT",
  "private": true,
  "scripts": { "dev": "next dev", "build": "next build", "start": "next start" },
  "dependencies": { "next": "$NEXT", "react": "$REACT", "react-dom": "$REACT", "@fadhelmurphy/next-devtools": "file:$TGZ" }
}
EOF
cat > next.config.js <<'EOF'
const { withNextDevtools } = require("@fadhelmurphy/next-devtools");

module.exports = withNextDevtools({
  reactStrictMode: true,
});
EOF
cat > pages/_app.js <<'EOF'
import Link from "next/link";
import { NextDevtools } from "@fadhelmurphy/next-devtools/client";

export default function App({ Component, pageProps }) {
  return (
    <>
      <nav style={{ display: "flex", gap: 16, padding: 16 }}>
        <Link href="/"><a>Home</a></Link>
        <Link href="/posts/1"><a>Post 1</a></Link>
      </nav>
      <main style={{ padding: 24, fontFamily: "system-ui" }}>
        <Component {...pageProps} />
      </main>
      <NextDevtools />
    </>
  );
}
EOF
cat > pages/index.js <<'EOF'
import { useState } from "react";
import { Greeting } from "../components/Greeting";

export default function Home() {
  const [name, setName] = useState("world");
  return (
    <div>
      <Greeting name={name} />
      <input value={name} onChange={(e) => setName(e.target.value)} />
    </div>
  );
}
EOF
cat > "pages/posts/[id].js" <<'EOF'
export async function getServerSideProps({ params }) {
  return { props: { id: String(params.id) } };
}

export default function Post({ id }) {
  return <h1 className="post">Post {id}</h1>;
}
EOF
cat > pages/api/hello.js <<'EOF'
export default function handler(req, res) {
  res.status(200).json({ hello: "world" });
}
EOF
cat > components/Greeting.js <<'EOF'
export function Greeting({ name }) {
  return <h1 className="greeting">Hello, {name}!</h1>;
}
EOF
echo 'NEXT_PUBLIC_SITE=compat' > .env.local
# Next 13+ <Link> renders its own <a>
if [ "${NEXT%%.*}" -ge 13 ]; then
  sed -i.bak 's#<Link href="/"><a>Home</a></Link>#<Link href="/">Home</Link>#; s#<Link href="/posts/1"><a>Post 1</a></Link>#<Link href="/posts/1">Post 1</Link>#' pages/_app.js && rm pages/_app.js.bak
fi
