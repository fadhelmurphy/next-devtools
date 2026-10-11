import type { GetServerSideProps } from "next";

type Props = { id: string; fetchedAt: string };

export const getServerSideProps: GetServerSideProps<Props> = async ({ params }) => ({
  props: { id: String(params?.id), fetchedAt: new Date().toISOString() },
});

export default function Post({ id, fetchedAt }: Props) {
  return (
    <article>
      <h1 className="post">Post: {id}</h1>
      <p>Rendered with getServerSideProps at {fetchedAt}.</p>
    </article>
  );
}
