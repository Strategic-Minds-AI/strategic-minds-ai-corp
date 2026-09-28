import useFramerTransition from "@/hooks/use-transition";
import SectionPageTitle from "@/components/sections/section-page-title";
import SectionGoogleMap from "@/components/sections/section-google-map";
import SectionContactForm from "@/components/sections/section-contact-form";
import { Helmet } from "react-helmet";

const Contact = useFramerTransition(
  <>
    <Helmet>
      <title>Contact</title>
    </Helmet>
    <main className="relative">
      <SectionPageTitle subtitle="Let’s have a dicussion about your business">
        Contact
      </SectionPageTitle>
      <SectionContactForm />
      <SectionGoogleMap />
    </main>
  </>,
);

export default Contact;
