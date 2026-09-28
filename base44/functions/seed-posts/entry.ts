import { createClientFromRequest } from "npm:@base44/sdk";
import samplePosts from "./sample-posts.json" with { type: "json" };

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return Response.json({ error: "Method not allowed" }, { status: 405 });
  }

  try {
    const base44 = createClientFromRequest(req);
    const existingPosts = await base44.asServiceRole.entities.Post.list("created_date", 5000);
    const existingFlatPosts = existingPosts.filter((post) =>
      typeof post.title === "string" &&
      typeof post.slug === "string" &&
      typeof post.content_markdown === "string"
    );

    if (existingFlatPosts.length > 0) {
      return Response.json({ seeded: false, count: existingFlatPosts.length });
    }

    const result = await base44.asServiceRole.entities.Post.bulkCreate(samplePosts);

    return Response.json({ seeded: true, count: samplePosts.length, result });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Failed to seed posts" },
      { status: 500 },
    );
  }
});
