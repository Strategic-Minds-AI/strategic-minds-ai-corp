import { Helmet } from 'react-helmet';
import SectionPageTitle from '@/components/sections/section-page-title';
import LegalContent from '@/components/agency/LegalContent';

export default function Privacy() {
  return (
    <>
      <Helmet>
        <title>Privacy Policy — Strategic Minds AI</title>
        <meta name="description" content="Privacy Policy for Strategic Minds AI — how we collect, use, and protect your personal information." />
      </Helmet>
      <main className="relative">
        <SectionPageTitle subtitle="How Strategic Minds AI collects, uses, and protects your personal information.">
          Privacy Policy
        </SectionPageTitle>
        <LegalContent lastUpdated="October 2, 2026">
          <p>
            Strategic Minds AI ("we," "us," or "our") respects your privacy. This Privacy Policy
            explains how we collect, use, disclose, and protect your personal information when you
            visit our website at <a href={window.location.origin}>{window.location.hostname}</a>{" "}
            or use our services.
          </p>

          <h2>1. Information We Collect</h2>
          <h3>Information You Provide</h3>
          <ul>
            <li><strong>Contact information:</strong> name, email address, phone number, and company details when you submit forms or request consultations.</li>
            <li><strong>Communication preferences:</strong> your consent to receive emails or SMS messages.</li>
            <li><strong>Project details:</strong> information you share during consultations or engagements.</li>
          </ul>
          <h3>Information Collected Automatically</h3>
          <ul>
            <li><strong>Usage data:</strong> IP address, browser type, pages visited, and referring URLs.</li>
            <li><strong>Cookies:</strong> we use cookies and similar technologies to improve site functionality and analytics.</li>
          </ul>

          <h2>2. How We Use Your Information</h2>
          <ul>
            <li>To provide, operate, and maintain our services</li>
            <li>To respond to inquiries and provide consultations</li>
            <li>To send marketing communications (with your consent)</li>
            <li>To analyze site usage and improve our offerings</li>
            <li>To comply with legal obligations</li>
          </ul>

          <h2>3. SMS Text Messaging</h2>
          <p>
            If you opt in to SMS communications, we will send text messages to the mobile number you
            provide. We do not sell or rent your mobile information to third parties. You may opt out
            at any time by replying STOP to any message. See our{' '}
            <a href="/sms-opt-in">SMS Opt-In Policy</a> for full details including message frequency,
            HELP/STOP instructions, and carrier disclaimers.
          </p>

          <h2>4. Sharing Your Information</h2>
          <p>
            We do not sell your personal information. We may share information with:
          </p>
          <ul>
            <li><strong>Service providers:</strong> third parties that support our operations (e.g., hosting, analytics, SMS delivery)</li>
            <li><strong>Legal compliance:</strong> when required by law or to protect our rights</li>
            <li><strong>Business transfers:</strong> in connection with a merger, acquisition, or asset sale</li>
          </ul>

          <h2>5. Data Retention</h2>
          <p>
            We retain your personal information for as long as necessary to fulfill the purposes
            described in this policy, comply with legal obligations, resolve disputes, and enforce
            our agreements.
          </p>

          <h2>6. Your Rights</h2>
          <p>You have the right to:</p>
          <ul>
            <li>Access the personal information we hold about you</li>
            <li>Request correction of inaccurate information</li>
            <li>Request deletion of your personal information</li>
            <li>Opt out of marketing communications at any time</li>
            <li>Withdraw consent for SMS communications by replying STOP</li>
          </ul>
          <p>
            To exercise these rights, contact us at <a href="tel:7722090266">772-209-0266</a> or via
            our <a href="/contact">contact page</a>.
          </p>

          <h2>7. Cookies</h2>
          <p>
            We use cookies to enhance your browsing experience, analyze traffic, and remember your
            preferences. You can control cookies through your browser settings. Disabling cookies
            may affect site functionality.
          </p>

          <h2>8. Security</h2>
          <p>
            We implement reasonable technical and organizational measures to protect your personal
            information. However, no method of transmission over the internet is completely secure,
            and we cannot guarantee absolute security.
          </p>

          <h2>9. Third-Party Services</h2>
          <p>
            Our Site may use third-party services (such as analytics and SMS providers) that collect
            information governed by their own privacy policies. We are not responsible for the
            privacy practices of third parties.
          </p>

          <h2>10. Children's Privacy</h2>
          <p>
            Our Site is not directed to individuals under 13 years of age. We do not knowingly
            collect personal information from children. If you believe we have collected information
            from a child, please contact us.
          </p>

          <h2>11. Changes to This Policy</h2>
          <p>
            We may update this Privacy Policy from time to time. Changes will be posted on this page
            with an updated revision date. We encourage you to review this page periodically.
          </p>

          <h2>12. Contact</h2>
          <p>
            If you have questions about this Privacy Policy, contact us at{' '}
            <a href="tel:7722090266">772-209-0266</a> or via our{' '}
            <a href="/contact">contact page</a>.
          </p>
        </LegalContent>
      </main>
    </>
  );
}