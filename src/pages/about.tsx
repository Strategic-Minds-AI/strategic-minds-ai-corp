import useFramerTransition from "@/hooks/use-transition";
import SectionPageTitle from "@/components/sections/section-page-title";
import HomeProcess from "@/components/agency/HomeProcess";
import HomeTrust from "@/components/agency/HomeTrust";
import SiteCallout from "@/components/agency/SiteCallout";
import {Helmet} from "react-helmet"

const About = useFramerTransition(
	<>
		<Helmet>
			<title>About</title>
		</Helmet>
		<main className="relative">
			<SectionPageTitle subtitle="Strategy, intelligence, automation and growth — grounded in responsible delivery and measurable business outcomes.">
				About Strategic Minds AI
			</SectionPageTitle>
			<HomeProcess />
			<HomeTrust />
			<SiteCallout />
		</main>
	</>
)

export default About