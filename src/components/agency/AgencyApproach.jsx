const steps = [
  ['Understand', 'We start with your business, not a tool. Your goals, people, and processes set the direction.'],
  ['Design', 'We shape a focused plan with clear priorities, practical milestones, and a shared definition of success.'],
  ['Build & refine', 'We implement thoughtfully, learn from real use, and equip your team to keep moving forward.'],
];
export default function AgencyApproach() {
  return <section id="approach" className="agency-container scroll-mt-24 grid gap-14 py-20 lg:grid-cols-2 lg:py-28"><div><p className="agency-eyebrow mb-5">02 / HOW WE WORK</p><h2 className="agency-heading">The thinking partner.<br /><em>The building partner.</em></h2><p className="max-w-sm text-sm leading-relaxed">One connected approach, from the first question to the systems your team uses every day.</p></div><div>{steps.map(([title, copy], index) => <div key={title} className="flex gap-6 border-t border-border py-7 first:pt-0 first:border-0"><span className="pt-1 font-display text-lg text-primary">0{index + 1}</span><div><h3 className="mb-3 text-lg font-medium">{title}</h3><p className="max-w-md text-sm leading-relaxed">{copy}</p></div></div>)}</div></section>;
}