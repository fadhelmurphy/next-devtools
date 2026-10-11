export function ProductCard({ product }: { product: { id: number; name: string; price: number } }) {
  return (
    <article className="card">
      <h2>{product.name}</h2>
      <p>${product.price}</p>
    </article>
  );
}
