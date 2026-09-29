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
      <SectionPageTitle subtitle="Tell us what you're working toward, and let's explore the right next step together." ctaLabel="Start a conversation" ctaHref="#contact-form">
        Contact
      </SectionPageTitle>
      <SectionContactForm />
      <SectionGoogleMap />
    </main>
  </>,
);

export default Contact;