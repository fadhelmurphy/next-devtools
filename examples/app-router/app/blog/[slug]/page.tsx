export default async function Post({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return (
    <article>
      <h1>Post: {slug}</h1>
      <p>A dynamic route.</p>
    </article>
  );
}
