import NewsletterForm from '@/components/forms/newsletter-form';

export default function ChecklistBridge() {
  return <div id="resources" className="agency-container relative z-10 -mt-16 scroll-mt-28">
    <div className="grid gap-8 rounded-md border border-border bg-card p-6 shadow-lg md:p-9 lg:grid-cols-[0.9fr_1.1fr] lg:gap-14">
      <div className="self-center">
        <p className="agency-eyebrow mb-3">FREE INSIDER PLAYBOOK</p>
        <h2 className="mb-4 font-heading text-2xl font-bold leading-tight md:text-3xl">7 tricks &amp; secrets most consultants charge $2,000 to share.</h2>
        <p className="max-w-lg text-base leading-relaxed">Real insider tactics with worked examples, ready-to-use AI prompts, fillable worksheets, and a 30-day action plan. Free. No strings. No signup wall.</p>
      </div>
      <NewsletterForm />
    </div>
  </div>;
}