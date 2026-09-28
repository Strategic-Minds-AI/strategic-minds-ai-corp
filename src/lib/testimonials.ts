import { base44 } from "@/api/base44Client";

const isValidTestimonial = (testimonial: Testimonial) =>
  typeof testimonial.name === "string" &&
  typeof testimonial.comment === "string" &&
  typeof testimonial.image_url === "string";

const sortTestimonials = (testimonials: Testimonial[]) =>
  [...testimonials].sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0));

export const fetchTestimonials = async () => {
  const testimonials = ((await base44.entities.Testimonial.list("created_date", 5000)) as Testimonial[]).filter(isValidTestimonial);

  if (testimonials.length > 0) {
    return sortTestimonials(testimonials);
  }

  await base44.functions.invoke("seed-testimonials", {});
  return sortTestimonials(
    ((await base44.entities.Testimonial.list("created_date", 5000)) as Testimonial[]).filter(isValidTestimonial),
  );
};

export const fetchTestimonialsByVariant = async (variant: Testimonial["variant"]) => {
  const testimonials = await fetchTestimonials();
  return testimonials.filter((testimonial) => testimonial.variant === variant);
};
