export async function getStaticProps() {
  return { props: { builtAt: new Date().toISOString() } };
}

export default function About({ builtAt }) {
  return (
    <section>
      <h1>About</h1>
      <p>Rendered with getStaticProps at {builtAt}.</p>
    </section>
  );
}
