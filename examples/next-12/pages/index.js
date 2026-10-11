import { useState } from "react";
import { Counter } from "../components/Counter";
import { Greeting } from "../components/Greeting";
import { ProductCard } from "../components/ProductCard";

const products = [
  { id: 1, name: "Trail shoes", price: 129 },
  { id: 2, name: "Running vest", price: 89 },
];

export default function Home() {
  const [name, setName] = useState("Next.js 12");
  return (
    <section>
      <Greeting name={name} />
      <input value={name} onChange={(e) => setName(e.target.value)} aria-label="Name" />
      <Counter initial={3} />
      {products.map((p) => (
        <ProductCard key={p.id} product={p} />
      ))}
      <img src="/images/logo.svg" alt="Logo" width={64} height={64} />
    </section>
  );
}
