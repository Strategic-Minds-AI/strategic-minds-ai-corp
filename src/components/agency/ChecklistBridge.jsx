import NewsletterForm from '@/components/forms/newsletter-form';

export default function ChecklistBridge() {
  return <div id="resources" className="agency-container relative z-10 -mt-16 scroll-mt-28">
    <div className="grid gap-8 rounded-md border border-border bg-card p-6 shadow-lg md:p-9 lg:grid-cols-[0.9fr_1.1fr] lg:gap-14">
      <div className="self-center">
        <p className="agency-eyebrow mb-3">A PRACTICAL PLACE TO START</p>
        <h2 className="mb-4 font-heading text-2xl font-bold leading-tight md:text-3xl">Get the free checklist: 7 ways to improve your business.</h2>
        <p className="max-w-lg text-base leading-relaxed">Find clearer priorities, better processes and practical opportunities for smarter growth.</p>
      </div>
      <NewsletterForm />
    </div>
  </div>;
}