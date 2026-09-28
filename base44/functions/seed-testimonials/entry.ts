import { createClientFromRequest } from "npm:@base44/sdk";
import sampleTestimonials from "./sample-testimonials.json" with { type: "json" };

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return Response.json({ error: "Method not allowed" }, { status: 405 });
  }

  try {
    const base44 = createClientFromRequest(req);
    const existingTestimonials = await base44.asServiceRole.entities.Testimonial.list("created_date", 5000);
    const existingFlatTestimonials = existingTestimonials.filter((testimonial) =>
      typeof testimonial.name === "string" &&
      typeof testimonial.comment === "string" &&
      typeof testimonial.image_url === "string"
    );

    if (existingFlatTestimonials.length > 0) {
      return Response.json({ seeded: false, count: existingFlatTestimonials.length });
    }

    const result = await base44.asServiceRole.entities.Testimonial.bulkCreate(sampleTestimonials);

    return Response.json({ seeded: true, count: sampleTestimonials.length, result });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Failed to seed testimonials" },
      { status: 500 },
    );
  }
});
