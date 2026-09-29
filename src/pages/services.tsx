import useFramerTransition from "@/hooks/use-transition";
import SectionPageTitle from "@/components/sections/section-page-title";
import ServiceDirectory from "@/components/services/ServiceDirectory";
import EngagementPaths from "@/components/services/EngagementPaths";
import { Helmet } from "react-helmet";

const Services = useFramerTransition(
  <>
    <Helmet>
      <title>Services</title>
    </Helmet>
    <main className="relative">
      <SectionPageTitle subtitle="AI strategy, automation, data intelligence and growth systems, built around measurable outcomes.">
        Services
      </SectionPageTitle>
      <EngagementPaths />
      <ServiceDirectory />
    </main>
  </>,
);

export default Services;