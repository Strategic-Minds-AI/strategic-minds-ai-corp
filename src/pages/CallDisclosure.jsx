import { Helmet } from 'react-helmet';
import SectionPageTitle from '@/components/sections/section-page-title';
import LegalContent from '@/components/agency/LegalContent';
import { Phone, Mic, Bot, ShieldAlert } from 'lucide-react';

export default function CallDisclosure() {
  return (
    <>
      <Helmet>
        <title>Voice Call & AI Disclosure — Strategic Minds AI</title>
        <meta name="description" content="Disclosure of AI voice technology, call recording, and two-party consent for voice calls from Strategic Minds AI." />
      </Helmet>
      <main className="relative">
        <SectionPageTitle subtitle="AI voice technology, call recording, and consent disclosure for voice communications.">
          Voice Call & AI Disclosure
        </SectionPageTitle>

        <section className="agency-container py-12 lg:py-20">
          <div className="mx-auto max-w-3xl space-y-8">

            {/* AI Voice Technology */}
            <div className="rounded-lg border border-border bg-card p-6 shadow-sm md:p-8">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                  <Bot size={20} className="text-primary" />
                </div>
                <h2 className="mb-0 text-lg font-bold text-foreground">AI Voice Technology</h2>
              </div>
              <p className="text-sm text-muted-foreground">
                Strategic Minds AI uses artificial intelligence voice technology to handle incoming
                and outgoing phone calls. Our AI assistant, Eden Skye, uses a neural text-to-speech
                voice (Amazon Polly) to converse with callers in natural language. When you call our
                number or receive a call from us, you may be speaking with an AI assistant rather than
                a human representative.
              </p>
              <p className="mt-3 text-sm text-muted-foreground">
                The AI assistant can schedule appointments, answer questions about our services, take
                messages, and route calls to a human representative when needed. All AI conversations
                are logged for quality and training purposes.
              </p>
            </div>

            {/* Call Recording */}
            <div className="rounded-lg border border-border bg-card p-6 shadow-sm md:p-8">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                  <Mic size={20} className="text-primary" />
                </div>
                <h2 className="mb-0 text-lg font-bold text-foreground">Call Recording Notice</h2>
              </div>
              <p className="text-sm text-muted-foreground">
                Phone calls to and from Strategic Minds AI may be recorded for quality assurance,
                training, and dispute resolution purposes. If a call is being recorded, you will be
                notified at the beginning of the call. By continuing the call after the notification,
                you consent to being recorded.
              </p>
              <p className="mt-3 text-sm text-muted-foreground">
                Call recordings and AI-generated transcripts are stored securely and retained in
                accordance with our{' '}
                <a href="/privacy" className="text-primary hover:underline">Privacy Policy</a>. You may
                request a copy of your call recording by contacting us.
              </p>
            </div>

            {/* Two-Party Consent */}
            <div className="rounded-lg border-l-4 border-primary bg-muted p-6 md:p-8">
              <div className="mb-3 flex items-center gap-2">
                <ShieldAlert size={18} className="text-primary" />
                <h3 className="mb-0 text-sm font-semibold uppercase tracking-wide text-primary">Two-Party Consent (Florida)</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Strategic Minds AI operates under Florida's two-party consent law (Fla. Stat. ch. 934.03),
                which requires all parties to a recorded call to consent to the recording. By calling our
                number or accepting a call from us, and remaining on the line after the recording
                notification, you provide your consent to the recording of the call.
              </p>
            </div>

            {/* Call Purpose */}
            <div className="rounded-lg border border-border bg-card p-6 shadow-sm md:p-8">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                  <Phone size={20} className="text-primary" />
                </div>
                <h2 className="mb-0 text-lg font-bold text-foreground">Purpose of Calls</h2>
              </div>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>Scheduling consultations and appointments</li>
                <li>Following up on inquiries and lead submissions</li>
                <li>Providing service updates and account information</li>
                <li>Delivering business insights and marketing communications (with your consent)</li>
                <li>Conducting business diagnostics and consultations</li>
              </ul>
            </div>

            {/* Opt Out of Voice Calls */}
            <div className="rounded-lg border border-border bg-card p-6 shadow-sm md:p-8">
              <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-primary">Opt Out of Voice Calls</h3>
              <p className="mb-3 text-sm text-muted-foreground">
                You may opt out of receiving voice calls from Strategic Minds AI at any time:
              </p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>Say "stop calling" or "opt out" during a call with our AI assistant</li>
                <li>Reply <strong className="text-foreground">STOP</strong> to any SMS message from us</li>
                <li>Visit our <a href="/unsubscribe" className="text-primary hover:underline">unsubscribe page</a> to opt out of all channels</li>
                <li>Call us at <a href="tel:7722090266" className="text-primary hover:underline">772-209-0266</a> and request to be removed from our call list</li>
              </ul>
              <p className="mt-3 text-sm text-muted-foreground">
                Opting out of voice calls also suppresses SMS, MMS, and WhatsApp messages unless you
                specifically opt back in to those channels.
              </p>
            </div>

            {/* Policies & Contact */}
            <div className="rounded-lg border border-border bg-card p-6 shadow-sm md:p-8">
              <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-primary">Policies & Contact</h3>
              <div className="flex flex-col gap-3 text-sm sm:flex-row sm:gap-6">
                <a href="/terms" className="flex items-center gap-2 text-primary hover:underline">Terms of Service →</a>
                <a href="/privacy" className="flex items-center gap-2 text-primary hover:underline">Privacy Policy →</a>
                <a href="/sms-opt-in" className="flex items-center gap-2 text-primary hover:underline">SMS Opt-In →</a>
                <a href="/unsubscribe" className="flex items-center gap-2 text-primary hover:underline">Unsubscribe →</a>
              </div>
              <div className="mt-4 flex items-center gap-2 border-t border-border pt-4 text-sm text-muted-foreground">
                <Phone size={14} className="text-primary" />
                <a href="tel:7722090266" className="text-primary hover:underline">772-209-0266</a>
              </div>
            </div>

          </div>
        </section>
      </main>
    </>
  );
}