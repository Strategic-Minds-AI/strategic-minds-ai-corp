import { Helmet } from 'react-helmet';
import SectionPageTitle from '@/components/sections/section-page-title';
import { MessageCircle, CheckCircle, Info, AlertCircle } from 'lucide-react';

const WHATSAPP_NUMBER = '(866) 571-1174';

export default function WhatsAppOptIn() {
  return (
    <>
      <Helmet>
        <title>WhatsApp Opt-In Policy — Strategic Minds AI</title>
        <meta name="description" content="WhatsApp Business opt-in policy for Strategic Minds AI — how to opt in, message types, frequency, and opt-out instructions." />
      </Helmet>
      <main className="relative">
        <SectionPageTitle subtitle="WhatsApp Business messaging opt-in details, message types, and opt-out instructions.">
          WhatsApp Opt-In Policy
        </SectionPageTitle>

        <section className="agency-container py-12 lg:py-20">
          <div className="mx-auto max-w-3xl space-y-8">

            {/* How to Opt In */}
            <div className="rounded-lg border border-border bg-card p-6 shadow-sm md:p-8">
              <div className="mb-6 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                  <MessageCircle size={20} className="text-primary" />
                </div>
                <h2 className="mb-0 text-lg font-bold text-foreground">How to Opt In to WhatsApp</h2>
              </div>
              <div className="space-y-4 text-sm text-muted-foreground">
                <p>
                  To opt in to WhatsApp Business messages from Strategic Minds AI, you must first
                  initiate a conversation with our WhatsApp number. Per Meta's WhatsApp Business
                  policy, businesses can only message users who have contacted them first or who
                  have provided explicit consent through a web form.
                </p>
                <div className="rounded-md bg-muted p-4">
                  <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Option 1 — Send a Message</p>
                  <p className="text-sm text-foreground">
                    Save <strong className="text-foreground">{WHATSAPP_NUMBER}</strong> to your contacts
                    and send <strong className="text-primary">"START"</strong> on WhatsApp to begin
                    receiving messages.
                  </p>
                </div>
                <div className="rounded-md bg-muted p-4">
                  <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Option 2 — Web Form Consent</p>
                  <p className="text-sm text-foreground">
                    Provide your WhatsApp number on our{' '}
                    <a href="/contact" className="text-primary hover:underline">contact form</a> or{' '}
                    <a href="/sms-opt-in" className="text-primary hover:underline">SMS opt-in page</a>{' '}
                    and check the WhatsApp consent box.
                  </p>
                </div>
              </div>
            </div>

            {/* Message Types */}
            <div className="rounded-lg border border-border bg-card p-6 shadow-sm md:p-8">
              <div className="mb-4 flex items-center gap-3">
                <Info size={18} className="text-primary" />
                <h3 className="mb-0 text-sm font-semibold uppercase tracking-wide text-primary">Message Types & Frequency</h3>
              </div>
              <p className="mb-3 text-sm text-muted-foreground">
                By opting in, you consent to receive the following types of WhatsApp messages:
              </p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex gap-2"><CheckCircle size={16} className="mt-0.5 shrink-0 text-primary" /> Business growth insights and marketing tips (up to 4/month)</li>
                <li className="flex gap-2"><CheckCircle size={16} className="mt-0.5 shrink-0 text-primary" /> Service updates and exclusive offers (up to 2/month)</li>
                <li className="flex gap-2"><CheckCircle size={16} className="mt-0.5 shrink-0 text-primary" /> Appointment reminders and confirmations (as needed)</li>
                <li className="flex gap-2"><CheckCircle size={16} className="mt-0.5 shrink-0 text-primary" /> Responses to your inquiries (as needed)</li>
              </ul>
              <p className="mt-3 text-sm text-muted-foreground">
                Message frequency varies based on your engagement and the campaigns we are running.
                You will receive no more than <strong className="text-foreground">6 messages per month</strong>.
              </p>
            </div>

            {/* Opt-Out Instructions */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
                <div className="mb-3 flex items-center gap-2">
                  <CheckCircle size={18} className="text-primary" />
                  <h3 className="mb-0 text-sm font-semibold uppercase tracking-wide text-primary">Opt Out on WhatsApp</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  Reply <strong className="text-foreground">STOP</strong> to any WhatsApp message
                  to unsubscribe and stop receiving messages. You will receive a confirmation
                  message confirming your opt-out.
                </p>
              </div>
              <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
                <div className="mb-3 flex items-center gap-2">
                  <AlertCircle size={18} className="text-destructive" />
                  <h3 className="mb-0 text-sm font-semibold uppercase tracking-wide text-destructive">Opt Out on Web</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  Visit our{' '}
                  <a href="/unsubscribe" className="text-primary hover:underline">unsubscribe page</a>{' '}
                  to opt out of all channels (SMS, WhatsApp, and voice calls) at once.
                </p>
              </div>
            </div>

            {/* Cross-Channel Notice */}
            <div className="rounded-lg border border-border bg-muted p-6 md:p-8">
              <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-primary">Cross-Channel Suppression</h3>
              <p className="text-sm text-muted-foreground">
                When you opt out of WhatsApp messages, your opt-out is recorded in our consent ledger
                and applies across <strong className="text-foreground">all communication channels</strong> —
                SMS, MMS, WhatsApp, and voice calls — unless you specifically opt back in to a
                particular channel. This ensures we respect your preferences consistently.
              </p>
            </div>

            {/* Data & Privacy */}
            <div className="rounded-lg border border-border bg-card p-6 shadow-sm md:p-8">
              <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-primary">Data & Privacy</h3>
              <p className="text-sm text-muted-foreground">
                Your WhatsApp number and message history are stored securely and used solely for
                delivering our services and communications. We do not sell or rent your mobile
                information to third parties. WhatsApp message data is subject to Meta's{' '}
                <a href="https://www.whatsapp.com/legal/privacy-policy" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Privacy Policy</a>{' '}
                in addition to our own. See our{' '}
                <a href="/privacy" className="text-primary hover:underline">Privacy Policy</a> for full details.
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
            </div>

          </div>
        </section>
      </main>
    </>
  );
}