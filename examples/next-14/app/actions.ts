"use server";

export async function like(formData: FormData) {
  const item = String(formData.get("item"));
  await new Promise((r) => setTimeout(r, 120));
  return { item, likes: Math.floor(Math.random() * 100) };
}
