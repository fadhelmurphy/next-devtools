import { Counter } from "@/components/Counter";
import { ProductCard } from "@/components/ProductCard";

const products = [
  { id: 1, name: "Trail shoes", price: 129 },
  { id: 2, name: "Running vest", price: 89 },
];

export default async function Home() {
  return (
    <section>
      <h1>Home</h1>
      <p>This page is a Server Component that renders a client counter.</p>
      <Counter initial={3} />
      {products.map((p) => (
        <ProductCard key={p.id} product={p} />
      ))}
      <img src="/images/logo.svg" alt="Logo" width={64} height={64} />
    </section>
  );
}
