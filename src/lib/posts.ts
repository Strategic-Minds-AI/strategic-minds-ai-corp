import { base44 } from "@/api/base44Client";

const isValidPost = (post: Post) =>
  typeof post.title === "string" &&
  typeof post.slug === "string" &&
  typeof post.content_markdown === "string";

const sortPosts = (posts: Post[]) =>
  [...posts].sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0));

export const fetchPosts = async () => {
  const posts = ((await base44.entities.Post.list("created_date", 5000)) as Post[]).filter(isValidPost);

  // Public reads never trigger privileged sample-data creation.
  return sortPosts(posts);
};

export const fetchPostBySlug = async (slug: string) => {
  const posts = await fetchPosts();
  return posts.find((post) => post.slug === slug) ?? null;
};