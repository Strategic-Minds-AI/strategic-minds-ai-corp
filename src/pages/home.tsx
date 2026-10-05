import useFramerTransition from "@/hooks/use-transition";
import SectionHero from "@/components/sections/section-hero";
import HomeHeroVideo from "@/components/agency/HomeHeroVideo";
import ServiceSpotlight from "@/components/services/ServiceSpotlight";
import SectionLatestNews from "@/components/sections/section-latest-news";
import HomeProcess from "@/components/agency/HomeProcess";
import HomeTrust from "@/components/agency/HomeTrust";
import SiteCallout from "@/components/agency/SiteCallout";
import ResourcesTeaser from "@/components/agency/ResourcesTeaser";
import SectionTestimonialsSlider from "@/components/sections/section-testimonials-slider";
import SitePWAInstall from "@/components/agency/SitePWAInstall";
import { Helmet } from "react-helmet"

const Home = useFramerTransition(
	<>
		<Helmet>
			<title>Strategic Minds AI — Marketing & Business Growth</title>
			<link rel="manifest" href="/site-manifest.json" />
			<meta name="theme-color" content="#0066ff" />
		</Helmet>
		<main className="relative">
			<SectionHero />
			<HomeHeroVideo />
			<ServiceSpotlight />
			<HomeProcess />
			<HomeTrust />
      <SectionTestimonialsSlider />
      <ResourcesTeaser />
      <SectionLatestNews />
      <SiteCallout />
      <SitePWAInstall />
		</main>
	</>
)

export default Home