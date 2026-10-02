import { Helmet } from 'react-helmet';
import SectionPageTitle from '@/components/sections/section-page-title';
import LegalContent from '@/components/agency/LegalContent';

export default function Terms() {
  return (
    <>
      <Helmet>
        <title>Terms of Service — Strategic Minds AI</title>
        <meta name="description" content="Terms of Service for Strategic Minds AI — the terms and conditions governing use of our website and services." />
      </Helmet>
      <main className="relative">
        <SectionPageTitle subtitle="The terms and conditions that govern your use of Strategic Minds AI's website and services.">
          Terms of Service
        </SectionPageTitle>
        <LegalContent lastUpdated="October 2, 2026">
          <p>
            These Terms of Service ("Terms") govern your access to and use of the Strategic Minds AI
            website located at <a href="https://strategic-ai-consulting.base44.app">strategic-ai-consulting.base44.app</a>{" "}
            (the "Site") and the services offered by Strategic Minds AI ("we," "us," or "our"). By
            accessing or using the Site, you agree to be bound by these Terms. If you do not agree,
            please do not use the Site.
          </p>

          <h2>1. Use of the Site</h2>
          <p>
            You may use the Site only for lawful purposes and in accordance with these Terms. You
            agree not to use the Site in any way that could damage, disable, overburden, or impair
            the Site or interfere with any other party's use. Unauthorized access, scraping, or
            automated data collection is prohibited.
          </p>

          <h2>2. Intellectual Property</h2>
          <p>
            All content on the Site — including text, graphics, logos, and software — is the property
            of Strategic Minds AI or its licensors and is protected by copyright and trademark laws.
            You may not reproduce, distribute, or create derivative works without our prior written
            consent.
          </p>

          <h2>3. Services & Consultations</h2>
          <p>
            Strategic Minds AI provides business consulting, marketing, and technology services.
            Specific engagement terms, deliverables, and pricing are governed by separate service
            agreements. Information on the Site is general and does not constitute professional
            advice tailored to your specific circumstances.
          </p>

          <h2>4. SMS Communications</h2>
          <p>
            By opting in to SMS communications, you consent to receive text messages from Strategic
            Minds AI at the number you provide. Message and data rates may apply. You may opt out at
            any time by replying STOP. For full details, see our{' '}
            <a href="/sms-opt-in">SMS Opt-In Policy</a>.
          </p>

          <h2>5. Third-Party Links</h2>
          <p>
            The Site may contain links to third-party websites. We are not responsible for the
            content, privacy policies, or practices of those sites. Your use of third-party sites is
            at your own risk.
          </p>

          <h2>6. Disclaimer of Warranties</h2>
          <p>
            The Site and its content are provided "as is" without warranties of any kind, either
            express or implied. We do not guarantee the accuracy, completeness, or reliability of
            any information on the Site.
          </p>

          <h2>7. Limitation of Liability</h2>
          <p>
            To the fullest extent permitted by law, Strategic Minds AI shall not be liable for any
            direct, indirect, incidental, consequential, or punitive damages arising from your use
            of or inability to use the Site or services.
          </p>

          <h2>8. Indemnification</h2>
          <p>
            You agree to indemnify and hold harmless Strategic Minds AI and its affiliates from any
            claims, damages, or expenses arising from your use of the Site or violation of these
            Terms.
          </p>

          <h2>9. Changes to These Terms</h2>
          <p>
            We may update these Terms from time to time. Changes will be posted on this page with an
            updated revision date. Your continued use of the Site after changes constitutes
            acceptance of the revised Terms.
          </p>

          <h2>10. Governing Law</h2>
          <p>
            These Terms are governed by the laws of the State of Florida, without regard to its
            conflict of law principles. Any disputes shall be resolved in the courts located in
            Florida.
          </p>

          <h2>11. Contact</h2>
          <p>
            If you have questions about these Terms, contact us at{' '}
            <a href="tel:7722090266">772-209-0266</a> or via our{' '}
            <a href="/contact">contact page</a>.
          </p>
        </LegalContent>
      </main>
    </>
  );
}