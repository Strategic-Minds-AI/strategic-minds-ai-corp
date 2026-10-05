import useFramerTransition from "@/hooks/use-transition";
import SectionHero from "@/components/sections/section-hero";
import ServiceSpotlight from "@/components/services/ServiceSpotlight";
import HomeProcess from "@/components/agency/HomeProcess";
import HomeTrust from "@/components/agency/HomeTrust";
import SiteCallout from "@/components/agency/SiteCallout";
import ResourcesTeaser from "@/components/agency/ResourcesTeaser";
import SitePWAInstall from "@/components/agency/SitePWAInstall";
import { Helmet } from "react-helmet";

const Home = useFramerTransition(
  <>
    <Helmet>
      <title>Strategic Minds AI — AI Strategy, Automation & Growth</title>
      <meta
        name="description"
        content="Strategic Minds AI designs practical AI systems, automation, software, intelligent workflows and digital growth strategies for businesses."
      />
      <link rel="manifest" href="/site-manifest.json" />
      <meta name="theme-color" content="#020817" />
    </Helmet>
    <main className="sm-cinematic-home relative">
      <SectionHero />
      <ServiceSpotlight />
      <HomeProcess />
      <HomeTrust />
      <ResourcesTeaser />
      <SiteCallout />
      <SitePWAInstall />
    </main>
  </>,
);

export default Home;