const themes = [
  { title: "Clarity before complexity", description: "A clear roadmap helps teams focus on the right opportunities before investing in new technology." },
  { title: "Systems that work together", description: "Useful AI should connect with existing workflows and make everyday work easier, not add more tools to manage." },
  { title: "Confidence beyond launch", description: "Practical support and thoughtful governance help teams adopt new capabilities with confidence." },
];

const SectionTestimonialsSlider = () => (
  <section className="border-y border-border bg-muted py-16 lg:py-24" aria-labelledby="feedback-themes-title">
    <div className="agency-container">
      <p className="agency-eyebrow mb-3">WHAT MATTERS IN A PARTNERSHIP</p>
      <h2 id="feedback-themes-title" className="mb-3 font-heading text-3xl font-bold tracking-tight md:text-4xl">The outcomes worth working toward.</h2>
      <p className="mb-10 max-w-2xl text-base leading-relaxed">The priorities behind a useful, lasting AI transformation.</p>
      <div className="grid gap-5 md:grid-cols-3">
        {themes.map(({ title, description }) => <article key={title} className="rounded-md border border-border bg-card p-7 shadow-sm"><h3 className="mb-4 text-xl font-semibold">{title}</h3><p className="text-base leading-relaxed">{description}</p></article>)}
      </div>
    </div>
  </section>
);

export default SectionTestimonialsSlider;