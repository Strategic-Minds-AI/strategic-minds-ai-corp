import TestimonialsSliderLayout2 from "@/components/testimonials-slider-layout-2";
import { fetchTestimonialsByVariant } from "@/lib/testimonials";
import { useQuery } from "@tanstack/react-query";
import { Pagination } from "swiper/modules";
import SectionTitle from "./section-title";

import "swiper/css";
import "swiper/css/pagination";

const SectionTestimonialsSliderLayout2 = () => {
  const { data: testimonials = [] } = useQuery({
    queryKey: ["testimonials", "layout_2"],
    queryFn: () => fetchTestimonialsByVariant("layout_2"),
  });

  return (
    <section className="overflow-hidden bg-gradient-to-b from-[#EBE4FA]/25 to-muted/25 py-20 dark:bg-slate-900 dark:bg-none lg:py-24">
      <div className="container overflow-hidden relative xl:left-[calc((100vw-1312px)/4)] xl:max-w-[calc(1312px+((100vw-1312px)/2))] xl:pr-[calc((100vw-1280px)/2)]">
        <SectionTitle
          subtitle="10,000k+ Customers those who already tried our services."
          sectionClasses="mx-auto max-w-xl text-center mb-12"
          titleClasses="mb-3 text-center"
          subtitleClasses="text-md font-medium"
        >
          Satisfied Customers
        </SectionTitle>
        <TestimonialsSliderLayout2
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
            modules: [Pagination],
            pagination: { clickable: true },
          }}
        />
      </div>
    </section>
  );
};

export default SectionTestimonialsSliderLayout2;
