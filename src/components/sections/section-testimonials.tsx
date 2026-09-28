import { fetchTestimonialsByVariant } from "@/lib/testimonials";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import SectionTitle from "./section-title";

const SectionTestimonials = () => {
  const { data: testimonials = [] } = useQuery({
    queryKey: ["testimonials", "default"],
    queryFn: () => fetchTestimonialsByVariant("default"),
  });

  return (
    <section className="py-16 lg:py-24">
      <div className="container max-w-5xl">
        <SectionTitle
          subtitle="Those who already tried it."
          sectionClasses="mx-auto mb-12 max-w-xl text-center"
          titleClasses="mb-3"
          subtitleClasses="text-md font-medium"
        >
          Satisfied Customers
        </SectionTitle>
        <motion.div
          initial={{ opacity: 0, y: 60 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{
            delay: 0.5,
          }}
        >
          <div className="testimonials-reversed space-y-12">
            {testimonials.map(({ image_url, name, company, comment }) => (
              <div
                key={name}
                className="flex flex-wrap items-center md:flex-nowrap md:space-x-16"
              >
                {image_url && (
                  <img
                    className="my-6 h-[181px] w-[181px] shrink-0 rounded-full object-cover"
                    src={image_url}
                    width={181}
                    height={181}
                    alt={`Testimonial ${name}`}
                  />
                )}
                <div className="testimonials__content">
                  {comment && <p className="mb-7 text-md">{comment}</p>}
                  <div className="testimonial__info">
                    {name && (
                      <span className="mb-1 block text-md font-bold text-foreground dark:text-white">
                        {name}
                      </span>
                    )}
                    {company && (
                      <span className="block text-sm font-bold">{company}</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default SectionTestimonials;
