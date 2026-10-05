import { base44 } from "@/api/base44Client";

const isValidTestimonial = (testimonial: Testimonial) =>
  typeof testimonial.name === "string" &&
  typeof testimonial.comment === "string" &&
  typeof testimonial.image_url === "string";

const sortTestimonials = (testimonials: Testimonial[]) =>
  [...testimonials].sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0));

export const fetchTestimonials = async () => {
  const page = await base44.entities.Testimonial.list({ sort: "created_date", limit: 5000 });
  const testimonials = (page.items as Testimonial[]).filter(isValidTestimonial);

  // Public reads never trigger privileged sample-data creation.
  return sortTestimonials(testimonials);
};

export const fetchTestimonialsByVariant = async (variant: Testimonial["variant"]) => {
  const testimonials = await fetchTestimonials();
  return testimonials.filter((testimonial) => testimonial.variant === variant);
};