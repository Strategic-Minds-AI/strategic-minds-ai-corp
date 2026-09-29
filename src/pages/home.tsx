import useFramerTransition from "@/hooks/use-transition";
import SectionHero from "@/components/sections/section-hero";
import ServiceSpotlight from "@/components/services/ServiceSpotlight";
import SectionLatestNews from "@/components/sections/section-latest-news";
import HomeProcess from "@/components/agency/HomeProcess";
import HomeTrust from "@/components/agency/HomeTrust";
import SiteCallout from "@/components/agency/SiteCallout";
import SectionTestimonialsSlider from "@/components/sections/section-testimonials-slider";
import {Helmet} from "react-helmet"

const Home = useFramerTransition(
	<>
		<Helmet>
			<title>Strategic Minds AI — Marketing & Business Growth</title>
		</Helmet>
		<main className="relative">
			<SectionHero />
			<ServiceSpotlight />
			<HomeProcess />
			<HomeTrust />
      <SectionTestimonialsSlider />
			<SectionLatestNews />
			<SiteCallout />
		</main>
	</>
)

export default Home