import useFramerTransition from "@/hooks/use-transition";
import SectionPageTitle from '@/components/sections/section-page-title';
import FocusedService from '@/components/services/FocusedService';
import { Helmet } from "react-helmet";

const HomeSEOAgency = useFramerTransition(
  <>
    <Helmet>
      <title>AI Search Visibility — Strategic Minds AI</title>
    </Helmet>
    <main className="relative">
      <SectionPageTitle subtitle="Be discoverable in search engines, answer engines and generative AI experiences.">AI Search Visibility</SectionPageTitle>
      <FocusedService id="search" />
    </main>
  </>,
);

export default HomeSEOAgency;