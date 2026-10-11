export async function getServerSideProps({ params }) {
  return { props: { id: String(params.id), fetchedAt: new Date().toISOString() } };
}

export default function Post({ id, fetchedAt }) {
  return (
    <article>
      <h1 className="post">Post: {id}</h1>
      <p>Rendered with getServerSideProps at {fetchedAt}.</p>
    </article>
  );
}
