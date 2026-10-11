import { useState } from "react";

export function Counter({ initial = 0 }: { initial?: number }) {
  const [count, setCount] = useState(initial);
  return (
    <div className="card">
      <p>Count: {count}</p>
      <button onClick={() => setCount((c) => c + 1)}>Increment</button>{" "}
      <button onClick={() => fetch("/api/hello").then((r) => r.json()).then((d) => alert(JSON.stringify(d)))}>Call /api/hello</button>
    </div>
  );
}
