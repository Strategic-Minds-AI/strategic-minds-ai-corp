import useFramerTransition from "@/hooks/use-transition";
import ServicesHero from "@/components/services/ServicesHero";
import SiteCallout from "@/components/agency/SiteCallout";
import ServiceDirectory from "@/components/services/ServiceDirectory";
import EngagementPaths from "@/components/services/EngagementPaths";
import { Helmet } from "react-helmet";

const Services = useFramerTransition(
  <>
    <Helmet>
      <title>AI Services — Strategic Minds AI</title>
    </Helmet>
    <main className="relative">
      <ServicesHero />
      <ServiceDirectory />
      <EngagementPaths />
      <SiteCallout />
    </main>
  </>,
);

export default Services;