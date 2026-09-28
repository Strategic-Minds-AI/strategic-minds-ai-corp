import TestimonialsSlider from "@/components/testimonials-slider";
import { fetchTestimonialsByVariant } from "@/lib/testimonials";
import { useQuery } from "@tanstack/react-query";
import { Navigation } from "swiper/modules";
import SectionTitle from "@/components/sections/section-title";

import "swiper/css";
import "swiper/css/navigation";

const SectionTestimonialsSlider = () => {
  const { data: testimonials = [] } = useQuery({
    queryKey: ["testimonials", "featured"],
    queryFn: () => fetchTestimonialsByVariant("featured"),
  });

  return (
    <section className="bg-secondary py-24">
      <div className="container max-w-6xl">
        <SectionTitle
          subtitle="Those who already tried it."
          sectionClasses="mb-12"
          titleClasses="mb-3 text-white"
          subtitleClasses="text-md font-medium text-white"
        >
          Satisfied Customers
        </SectionTitle>
        <TestimonialsSlider
          testimonials={testimonials}
          swiperParams={{
            breakpoints: {
              768: {
                slidesPerView: 2,
              },
              1025: {
                slidesPerView: 2,
              },
            },
            spaceBetween: 40,
            modules: [Navigation],
          }}
        />
      </div>
    </section>
  );
};

export default SectionTestimonialsSlider;
