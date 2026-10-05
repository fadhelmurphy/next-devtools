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
