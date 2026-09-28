import useFramerTransition from "@/hooks/use-transition";
import SectionPageTitle from "@/components/sections/section-page-title";
import SectionCTALayout4 from "@/components/sections/section-cta-layout-4";
import SectionPricingTables from "@/components/sections/section-pricing-tables";
import SectionFAQLayout2 from "@/components/sections/section-faq-layout-2";
import SectionMoneyBack from "@/components/sections/section-money-back";
import {Helmet} from "react-helmet"

const Pricing = useFramerTransition(
	<>
		<Helmet>
			<title>Pricing</title>
		</Helmet>
		<main className="relative">
			<SectionPageTitle subtitle="Here are the best features that makes Margin the most powerful, fast and user-friendly platform.">
				Price Transparency
			</SectionPageTitle>
			<SectionPricingTables />
			<SectionMoneyBack />
			<SectionFAQLayout2 />
			<SectionCTALayout4 />
		</main>
	</>
)

export default Pricing