import useFramerTransition from "@/hooks/use-transition";
import SectionPageTitle from "@/components/sections/section-page-title";
import CommerceCatalog from "@/components/commerce/CommerceCatalog";
import {Helmet} from "react-helmet"

const Pricing = useFramerTransition(
	<>
		<Helmet>
			<title>Pricing</title>
		</Helmet>
		<main className="relative">
			<SectionPageTitle subtitle="Explore our services, subscriptions and custom projects.">
				Services & Pricing
			</SectionPageTitle>
			<CommerceCatalog />
		</main>
	</>
)

export default Pricing