import type { GetServerSideProps } from "next";

export const getServerSideProps: GetServerSideProps<{ id: string }> = async ({ params }) => ({
  props: { id: String(params?.id) },
});

export default function Post({ id }: { id: string }) {
  return <h1>Post {id}</h1>;
}
