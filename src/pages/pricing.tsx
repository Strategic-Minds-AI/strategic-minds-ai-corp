import useFramerTransition from "@/hooks/use-transition";
import SectionPageTitle from "@/components/sections/section-page-title";
import CommerceCatalog from "@/components/commerce/CommerceCatalog";
import EngagementPaths from "@/components/services/EngagementPaths";
import PricingOverview from "@/components/services/PricingOverview";
import MarketContext from "@/components/services/MarketContext";
import PricingFAQ from "@/components/services/PricingFAQ";
import {Helmet} from "react-helmet"

const Pricing = useFramerTransition(
	<>
		<Helmet>
			<title>Pricing</title>
		</Helmet>
		<main className="relative">
			<SectionPageTitle subtitle="Transparent starting points for strategy, implementation and ongoing growth. Enterprise work is custom quoted." ctaLabel="Discuss your investment">
				Services & Pricing
			</SectionPageTitle>
			<EngagementPaths />
			<PricingOverview />
			<MarketContext />
			<CommerceCatalog />
			<PricingFAQ />
		</main>
	</>
)

export default Pricing