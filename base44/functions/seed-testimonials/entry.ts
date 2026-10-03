import { createClientFromRequest } from "../../shared/ownedClient.ts";
import { requireAgencyAdmin } from '../../shared/agencyAdminAccess.ts';
import sampleTestimonials from "./sample-testimonials.json" with { type: "json" };

export default async function(req) {
  if (req.method !== "POST") {
    return Response.json({ error: "Method not allowed" }, { status: 405 });
  }

  try {
    const base44 = createClientFromRequest(req);
    const access = await requireAgencyAdmin(base44);
    if (access.response) return access.response;
    const body = await req.json();
    if (body?.approved !== true) return Response.json({ error: 'Explicit approval is required before creating sample content.' }, { status: 403 });
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
}