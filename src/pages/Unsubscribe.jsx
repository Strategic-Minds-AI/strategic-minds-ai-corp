import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import SectionPageTitle from '@/components/sections/section-page-title';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CheckCircle, AlertCircle, Loader2, Phone, Mail } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function Unsubscribe() {
  const urlParams = new URLSearchParams(window.location.search);
  const [phone, setPhone] = useState(urlParams.get('phone') || '');
  const [email, setEmail] = useState(urlParams.get('email') || '');
  const [mode, setMode] = useState(urlParams.get('email') ? 'email' : 'phone');
  const [status, setStatus] = useState('idle'); // idle | submitting | success | error
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (urlParams.get('phone')) setMode('phone');
    if (urlParams.get('email')) setMode('email');
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus('submitting');
    setErrorMsg('');

    try {
      const payload = { action: 'optOut' };
      if (mode === 'phone') {
        if (!phone.trim()) {
          setErrorMsg('Please enter your phone number.');
          setStatus('error');
          return;
        }
        payload.phone_number = phone.trim();
      } else {
        if (!email.trim()) {
          setErrorMsg('Please enter your email address.');
          setStatus('error');
          return;
        }
        payload.email = email.trim();
      }

      const result = await base44.functions.invoke('manageConsent', payload);

      if (result?.success) {
        setStatus('success');
      } else {
        setErrorMsg(result?.error || 'Something went wrong. Please try again.');
        setStatus('error');
      }
    } catch (err) {
      setErrorMsg(err.message || 'Unable to process your request. Please try again or call us.');
      setStatus('error');
    }
  }

  return (
    <>
      <Helmet>
        <title>Unsubscribe — Strategic Minds AI</title>
        <meta name="description" content="Unsubscribe from SMS, WhatsApp, voice calls, and email communications from Strategic Minds AI." />
      </Helmet>
      <main className="relative">
        <SectionPageTitle subtitle="Opt out of all communications from Strategic Minds AI — SMS, MMS, WhatsApp, voice calls, and email.">
          Unsubscribe
        </SectionPageTitle>

        <section className="agency-container py-12 lg:py-20">
          <div className="mx-auto max-w-xl">

            {status === 'success' ? (
              <div className="rounded-lg border border-border bg-card p-8 text-center shadow-sm">
                <CheckCircle size={48} className="mx-auto mb-4 text-primary" />
                <h2 className="mb-3 text-xl font-bold text-foreground">You're Unsubscribed</h2>
                <p className="text-sm text-muted-foreground">
                  You have been successfully unsubscribed from all Strategic Minds AI communications,
                  including SMS, MMS, WhatsApp, voice calls, and email. You will receive a confirmation
                  message shortly. You may opt back in at any time by replying START to any message or
                  visiting our{' '}
                  <a href="/sms-opt-in" className="text-primary hover:underline">SMS opt-in page</a>.
                </p>
              </div>
            ) : (
              <div className="rounded-lg border border-border bg-card p-6 shadow-sm md:p-8">
                <p className="mb-6 text-sm text-muted-foreground">
                  Enter your phone number or email address below to opt out of all communications from
                  Strategic Minds AI. This will suppress your number across all channels: SMS, MMS,
                  WhatsApp, and voice calls.
                </p>

                {/* Mode Toggle */}
                <div className="mb-6 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setMode('phone')}
                    className={`flex flex-1 items-center justify-center gap-2 rounded-md border px-4 py-3 text-sm font-medium transition-colors ${
                      mode === 'phone'
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-border text-muted-foreground hover:bg-muted'
                    }`}
                  >
                    <Phone size={16} /> Phone
                  </button>
                  <button
                    type="button"
                    onClick={() => setMode('email')}
                    className={`flex flex-1 items-center justify-center gap-2 rounded-md border px-4 py-3 text-sm font-medium transition-colors ${
                      mode === 'email'
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-border text-muted-foreground hover:bg-muted'
                    }`}
                  >
                    <Mail size={16} /> Email
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  {mode === 'phone' ? (
                    <div>
                      <label htmlFor="phone" className="mb-2 block text-sm font-medium text-foreground">
                        Phone Number
                      </label>
                      <Input
                        id="phone"
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="(555) 123-4567"
                        className="h-12"
                        autoComplete="tel"
                      />
                      <p className="mt-2 text-xs text-muted-foreground">
                        Enter the phone number that receives our messages.
                      </p>
                    </div>
                  ) : (
                    <div>
                      <label htmlFor="email" className="mb-2 block text-sm font-medium text-foreground">
                        Email Address
                      </label>
                      <Input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        className="h-12"
                        autoComplete="email"
                      />
                      <p className="mt-2 text-xs text-muted-foreground">
                        Enter the email address that receives our messages.
                      </p>
                    </div>
                  )}

                  {status === 'error' && (
                    <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
                      <AlertCircle size={16} className="mt-0.5 shrink-0" />
                      <span>{errorMsg}</span>
                    </div>
                  )}

                  <Button
                    type="submit"
                    disabled={status === 'submitting'}
                    className="w-full"
                    size="lg"
                  >
                    {status === 'submitting' ? (
                      <>
                        <Loader2 size={16} className="animate-spin" /> Processing...
                      </>
                    ) : (
                      'Unsubscribe from All Channels'
                    )}
                  </Button>
                </form>

                <div className="mt-6 border-t border-border pt-6">
                  <p className="text-xs text-muted-foreground">
                    Prefer to opt out by phone? Call us at{' '}
                    <a href="tel:7722090266" className="text-primary hover:underline">772-209-0266</a>.
                    You can also reply <strong className="text-foreground">STOP</strong> to any SMS or
                    WhatsApp message to opt out instantly.
                  </p>
                </div>
              </div>
            )}

            {/* Cross-Channel Notice */}
            <div className="mt-6 rounded-lg border border-border bg-muted p-6">
              <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-primary">
                Cross-Channel Suppression
              </h3>
              <p className="text-xs text-muted-foreground">
                Your opt-out is recorded in our consent ledger and applies to all communication channels.
                We will not send you SMS, MMS, WhatsApp, or voice call messages after you unsubscribe.
                Email opt-outs apply to marketing emails only; transactional emails (e.g., receipts,
                appointment confirmations) may still be sent as required by law.
              </p>
            </div>

            {/* Quick Links */}
            <div className="mt-6 flex flex-wrap justify-center gap-4 text-xs text-muted-foreground">
              <a href="/sms-opt-in" className="hover:text-primary">SMS Opt-In Policy</a>
              <a href="/whatsapp-opt-in" className="hover:text-primary">WhatsApp Policy</a>
              <a href="/call-disclosure" className="hover:text-primary">Call Disclosure</a>
              <a href="/privacy" className="hover:text-primary">Privacy Policy</a>
              <a href="/terms" className="hover:text-primary">Terms of Service</a>
            </div>

          </div>
        </section>
      </main>
    </>
  );
}