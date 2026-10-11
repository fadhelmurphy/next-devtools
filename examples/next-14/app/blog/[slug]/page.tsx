export default function Post({ params }: { params: { slug: string } }) {
  return (
    <article>
      <h1>Post: {params.slug}</h1>
      <p>A dynamic route.</p>
    </article>
  );
}
