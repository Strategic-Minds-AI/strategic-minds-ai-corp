import { Helmet } from 'react-helmet';
import SectionPageTitle from '@/components/sections/section-page-title';
import { MessageSquare, Phone, CheckCircle, Info, AlertCircle } from 'lucide-react';

// ──────────────────────────────────────────────────────────────
// SMS OPT-IN CAMPAIGN PAGE — Twilio compliance
//
// Update SMS_NUMBER and SMS_KEYWORD below once your Twilio number
// is provisioned.
// ──────────────────────────────────────────────────────────────

const SMS_NUMBER = '[YOUR TWILIO NUMBER]'; // ← Replace with your Twilio number
const SMS_KEYWORD = 'START'; // ← The keyword customers text to opt in

export default function SmsOptIn() {
  return (
    <>
      <Helmet>
        <title>SMS Opt-In Policy — Strategic Minds AI</title>
        <meta name="description" content="SMS opt-in campaign details for Strategic Minds AI — keyword, message frequency, HELP/STOP instructions, and carrier disclaimers." />
      </Helmet>
      <main className="relative">
        <SectionPageTitle subtitle="SMS opt-in campaign details, message frequency, and instructions for managing your subscription.">
          SMS Opt-In Policy
        </SectionPageTitle>

        <section className="agency-container py-12 lg:py-20">
          <div className="mx-auto max-w-3xl space-y-8">

            {/* Opt-in Instructions Card */}
            <div className="rounded-lg border border-border bg-card p-6 shadow-sm md:p-8">
              <div className="mb-6 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                  <MessageSquare size={20} className="text-primary" />
                </div>
                <h2 className="mb-0 text-lg font-bold text-foreground">How to Opt In</h2>
              </div>
              <div className="space-y-4 text-sm text-muted-foreground">
                <p>
                  To opt in to SMS communications from Strategic Minds AI, text the keyword below to
                  our dedicated number. By opting in, you consent to receive recurring automated
                  marketing and informational text messages at the mobile number you provide.
                </p>
                <div className="rounded-md bg-muted p-4">
                  <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Step 1</p>
                  <p className="text-sm text-foreground">
                    Text <strong className="text-primary">"{SMS_KEYWORD}"</strong> to{' '}
                    <strong className="text-foreground">{SMS_NUMBER}</strong>
                  </p>
                </div>
                <div className="rounded-md bg-muted p-4">
                  <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Step 2</p>
                  <p className="text-sm text-foreground">
                    You will receive a confirmation message welcoming you to the service. Reply
                    <strong className="text-primary"> YES</strong> to confirm your subscription.
                  </p>
                </div>
              </div>
            </div>

            {/* Welcome Message */}
            <div className="rounded-lg border border-border bg-card p-6 shadow-sm md:p-8">
              <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-primary">Welcome Message</h3>
              <div className="rounded-md border-l-4 border-primary bg-muted p-4">
                <p className="text-sm italic text-muted-foreground">
                  "Welcome to Strategic Minds AI! You've successfully subscribed to receive updates on
                  business growth strategies, marketing insights, and exclusive offers. Message
                  frequency varies (up to 4 messages/month). Reply HELP for help, STOP to cancel.
                  Msg &amp; data rates may apply."
                </p>
              </div>
            </div>

            {/* Message Frequency */}
            <div className="rounded-lg border border-border bg-card p-6 shadow-sm md:p-8">
              <div className="mb-4 flex items-center gap-3">
                <Info size={18} className="text-primary" />
                <h3 className="mb-0 text-sm font-semibold uppercase tracking-wide text-primary">Message Frequency</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                You will receive up to <strong className="text-foreground">4 messages per month</strong>{' '}
                containing business insights, marketing tips, service updates, and special offers.
                Message frequency may vary based on your engagement and the campaigns we are running.
              </p>
            </div>

            {/* HELP and STOP Instructions */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
                <div className="mb-3 flex items-center gap-2">
                  <CheckCircle size={18} className="text-primary" />
                  <h3 className="mb-0 text-sm font-semibold uppercase tracking-wide text-primary">HELP</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  Reply <strong className="text-foreground">HELP</strong> to any message at any time
                  to receive support information, including how to contact customer service and how
                  to opt out.
                </p>
              </div>
              <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
                <div className="mb-3 flex items-center gap-2">
                  <AlertCircle size={18} className="text-destructive" />
                  <h3 className="mb-0 text-sm font-semibold uppercase tracking-wide text-destructive">STOP</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  Reply <strong className="text-foreground">STOP</strong> to any message to cancel
                  your subscription and stop receiving messages. You will receive a confirmation
                  message confirming your opt-out.
                </p>
              </div>
            </div>

            {/* Carrier Disclaimers */}
            <div className="rounded-lg border border-border bg-muted p-6 md:p-8">
              <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-primary">Standard Disclaimers</h3>
              <ul className="space-y-2 text-xs text-muted-foreground">
                <li>• Message and data rates may apply for each message sent and received.</li>
                <li>• Strategic Minds AI is not responsible for any carrier charges incurred.</li>
                <li>• Availability of service may vary by carrier and is subject to carrier support.</li>
                <li>• You must be the mobile account holder or have authorization to opt in.</li>
                <li>• We may modify or discontinue the SMS service at any time without notice.</li>
              </ul>
            </div>

            {/* Confirmation Flow */}
            <div className="rounded-lg border border-border bg-card p-6 shadow-sm md:p-8">
              <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-primary">Opt-In Confirmation Flow</h3>
              <ol className="space-y-3 text-sm text-muted-foreground">
                <li><strong className="text-foreground">1.</strong> You text "{SMS_KEYWORD}" to {SMS_NUMBER}.</li>
                <li><strong className="text-foreground">2.</strong> We send a welcome message with service details and a request to confirm.</li>
                <li><strong className="text-foreground">3.</strong> You reply "YES" to confirm your subscription.</li>
                <li><strong className="text-foreground">4.</strong> You receive a confirmation message — you are now subscribed.</li>
                <li><strong className="text-foreground">5.</strong> To unsubscribe at any time, reply "STOP" to any message.</li>
              </ol>
            </div>

            {/* Privacy & Terms Links */}
            <div className="rounded-lg border border-border bg-card p-6 shadow-sm md:p-8">
              <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-primary">Policies &amp; Contact</h3>
              <div className="flex flex-col gap-3 text-sm sm:flex-row sm:gap-6">
                <a href="/terms" className="flex items-center gap-2 text-primary hover:underline">Terms of Service →</a>
                <a href="/privacy" className="flex items-center gap-2 text-primary hover:underline">Privacy Policy →</a>
                <a href="/contact" className="flex items-center gap-2 text-primary hover:underline">Contact Us →</a>
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