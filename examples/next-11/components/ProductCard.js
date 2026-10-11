export function ProductCard({ product }) {
  return (
    <article className="card">
      <h2>{product.name}</h2>
      <p>${product.price}</p>
    </article>
  );
}
