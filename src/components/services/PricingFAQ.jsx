import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

const FAQS = [
  {
    q: 'How do you price your services?',
    a: 'Most offerings are fixed-price with transparent starting points listed above. Enterprise and multi-system engagements are custom-quoted after a discovery call. One-time projects are billed at project start; subscriptions are billed monthly or annually.',
  },
  {
    q: 'Is there a setup fee?',
    a: 'Most one-time projects include setup in the listed price. Subscription services may include a one-time onboarding fee for data migration, CRM integration, or agent training — this is always quoted before work begins, never added silently.',
  },
  {
    q: 'What payment methods do you accept?',
    a: 'All payments are processed securely through Stripe. We accept major credit and debit cards (Visa, Mastercard, American Express, Discover). Enterprise clients can request invoicing with net-15 or net-30 terms.',
  },
  {
    q: 'Do you offer refunds?',
    a: 'Assessments and strategy work are non-refundable once delivered. Implementation projects include a 14-day satisfaction window — if the delivered work does not meet the agreed scope, we will revise it at no cost. Subscriptions can be cancelled anytime; you are billed only through the end of the current period.',
  },
  {
    q: 'Can I upgrade or downgrade my subscription?',
    a: 'Yes. You can change your subscription tier at any time. Upgrades take effect immediately and are prorated. Downgrades take effect at the end of the current billing period so you retain full access to what you paid for.',
  },
  {
    q: 'What happens after I pay?',
    a: 'You receive an email confirmation immediately. A team member reviews your order and reaches out within one business day to schedule a kickoff call. For most one-time projects, work begins within 3–5 business days of payment.',
  },
  {
    q: 'Do you work with businesses outside the US?',
    a: 'Yes. We work with clients globally and bill in USD. For enterprise engagements in other currencies, we can invoice in EUR, GBP, or CAD on request.',
  },
  {
    q: 'How is enterprise work scoped?',
    a: 'Enterprise and multi-agent systems start with a paid discovery engagement (the AI Transformation Roadmap or Executive AI Strategy). The roadmap defines scope, timeline, and fixed price. The roadmap fee is credited toward the implementation if you proceed within 60 days.',
  },
];

export default function PricingFAQ() {
  const [open, setOpen] = useState(null);
  return (
    <section className="agency-container py-16 lg:py-24" aria-label="Pricing FAQ">
      <div className="mx-auto max-w-3xl">
        <p className="agency-eyebrow mb-3">QUESTIONS</p>
        <h2 className="agency-heading mb-8">Pricing, answered.</h2>
        <div className="divide-y divide-border rounded border border-border bg-card">
          {FAQS.map((item, index) => {
            const isOpen = open === index;
            return (
              <div key={index}>
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? null : index)}
                  className="flex w-full items-center justify-between gap-4 p-5 text-left transition hover:bg-muted"
                  aria-expanded={isOpen}
                >
                  <span className="text-sm font-semibold text-foreground">{item.q}</span>
                  <ChevronDown size={18} className={`shrink-0 text-muted-foreground transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                </button>
                {isOpen && <p className="px-5 pb-5 text-sm leading-relaxed text-muted-foreground">{item.a}</p>}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}