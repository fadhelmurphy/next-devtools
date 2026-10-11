"use client";
import { useState, useTransition } from "react";
import { like } from "@/app/actions";

export function HelloButton() {
  const [msg, setMsg] = useState<string | null>(null);
  const [pending, start] = useTransition();
  return (
    <div className="card">
      <button onClick={async () => setMsg(JSON.stringify(await (await fetch("/api/hello")).json()))}>Call /api/hello</button>{" "}
      <button
        disabled={pending}
        onClick={() =>
          start(async () => {
            const fd = new FormData();
            fd.set("item", "trail-shoes");
            const r = await like(fd);
            setMsg(`${r.item}: ${r.likes} likes`);
          })
        }
      >
        Run server action
      </button>
      {msg && <p>{msg}</p>}
    </div>
  );
}
