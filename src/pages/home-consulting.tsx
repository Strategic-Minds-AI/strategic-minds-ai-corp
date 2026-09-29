import useFramerTransition from "@/hooks/use-transition";
import SectionPageTitle from '@/components/sections/section-page-title';
import FocusedService from '@/components/services/FocusedService';
import HomeProcess from '@/components/agency/HomeProcess';
import { Helmet } from "react-helmet";

const HomeConsulting = useFramerTransition(
  <>
    <Helmet>
      <title>AI Strategy & Consulting — Strategic Minds AI</title>
    </Helmet>
    <main className="relative">
      <SectionPageTitle subtitle="From AI opportunity discovery to executive advisory and implementation roadmaps." ctaLabel="Plan your AI strategy">AI Strategy & Consulting</SectionPageTitle>
      <FocusedService id="strategy" />
      <HomeProcess />
    </main>
  </>,
);

export default HomeConsulting;