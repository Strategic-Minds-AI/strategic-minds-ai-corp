import PromoTriangle from "@/components/promo-triangle";
import { Button } from "@/components/ui/button";
import { ChevronRightIcon } from "@heroicons/react/20/solid";
import { Link } from "react-router-dom";

const SectionPromo = () => {
  return (
    <section className="relative py-14 lg:py-24">
      <div className="container grid items-center gap-10 md:grid-cols-2 lg:gap-16">
        <PromoTriangle />
        <div>
          <h2 className="max-w-md">
            Is your website driving sales for your business?
          </h2>
          <p className="mb-7 text-sm leading-relaxed">
            As you may already know, there are an infinite number of things you
            can test on your site to help you increase sales. From layout to
            copy to design, there are limitless combinations of changes that may
            improve your visitor-to-sale conversion rate. But what&apos;s
            &quot;enough&quot; when you&apos;re just starting out? What elements
            should you focus on testing before rolling out your traffic
            campaign?
          </p>
          <Link to="/contact">
            <Button>
              Get Started
              <ChevronRightIcon width={20} height={20} className="-mr-2 ml-4" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default SectionPromo;