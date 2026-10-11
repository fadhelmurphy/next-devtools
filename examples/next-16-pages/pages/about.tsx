import type { GetStaticProps } from "next";

export const getStaticProps: GetStaticProps<{ builtAt: string }> = async () => ({
  props: { builtAt: new Date().toISOString() },
});

export default function About({ builtAt }: { builtAt: string }) {
  return (
    <section>
      <h1>About</h1>
      <p>Rendered with getStaticProps at {builtAt}.</p>
    </section>
  );
}
