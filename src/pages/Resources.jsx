import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { Smartphone, Download, Bell, Lightbulb, Wand2, TrendingUp, Key, ArrowRight, FileText } from 'lucide-react';
import useFramerTransition from '@/hooks/use-transition';

function Resources() {
  const Transition = useFramerTransition(
    <>
      <Helmet><title>Free Insider App — Strategic Minds AI</title></Helmet>
      <main className="relative">
        <section className="agency-container py-12 lg:py-20">
          <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
            <div>
              <p className="agency-eyebrow mb-3">FREE INSIDER APP</p>
              <h1 className="mb-4 font-heading text-3xl font-bold leading-tight md:text-4xl">Get the insider app that puts real business intelligence in your pocket.</h1>
              <p className="mb-6 max-w-lg text-base leading-relaxed text-muted-foreground">Install the Strategic Minds Insider app on your phone and get ongoing access to tips, tricks, and wealth-building strategies — the kind most consultants charge $2,000 to share. Free. No signup wall. Works offline.</p>
              <div className="flex flex-wrap gap-3">
                <Link to="/insider" className="agency-button"><Smartphone size={17} /> Open the app</Link>
                <a href="#whats-inside" className="inline-flex items-center gap-2 rounded-sm border border-border px-6 py-3 text-xs font-medium text-foreground hover:border-primary">What's inside?</a>
              </div>
            </div>
            <div className="relative">
              <div className="mx-auto max-w-xs">
                <div className="rounded-[2rem] border-4 border-slate-800 bg-background p-3 shadow-2xl dark:border-slate-700">
                  <div className="mb-2 flex justify-center">
                    <div className="h-1.5 w-16 rounded-full bg-slate-300 dark:bg-slate-700" />
                  </div>
                  <div className="rounded-[1.5rem] bg-gradient-to-br from-blue-600 to-blue-800 p-5 text-white">
                    <Lightbulb size={28} className="mb-2" />
                    <p className="text-xs font-semibold text-blue-100">STRATEGIC MINDS INSIDER</p>
                    <h3 className="mt-1 text-lg font-bold">7 tricks & secrets</h3>
                    <div className="mt-3 space-y-2">
                      <div className="rounded-lg bg-white/15 p-2 text-xs">The 5-minute cliff</div>
                      <div className="rounded-lg bg-white/15 p-2 text-xs">The constraint sells</div>
                      <div className="rounded-lg bg-white/15 p-2 text-xs">Give before you ask</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="whats-inside" className="agency-container py-12 lg:py-16">
          <h2 className="mb-2 text-center font-heading text-2xl font-bold md:text-3xl">What's inside the app</h2>
          <p className="mb-10 text-center text-sm text-muted-foreground">Four categories of insider content, updated regularly.</p>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <CategoryCard icon={Lightbulb} title="Quick Tips" desc="Short, actionable tactics you can apply in under 10 minutes." color="blue" />
            <CategoryCard icon={Wand2} title="Insider Tricks" desc="Specific, non-obvious techniques that give you an edge." color="violet" />
            <CategoryCard icon={TrendingUp} title="Wealth Builders" desc="Revenue-focused strategies for sustainable growth." color="emerald" />
            <CategoryCard icon={Key} title="Insider Secrets" desc="The 7 core secrets most consultants gate behind paid assessments." color="amber" />
          </div>
        </section>

        <section className="agency-container py-12 lg:py-16">
          <div className="rounded-md border border-border bg-card p-8 md:p-12">
            <h2 className="mb-8 text-center font-heading text-2xl font-bold md:text-3xl">How to install</h2>
            <div className="grid gap-8 md:grid-cols-3">
              <Step number="1" title="Open the app" desc="Tap 'Open the app' to launch the Insider experience in your browser." />
              <Step number="2" title="Add to home screen" desc="Tap the install prompt or use your browser's 'Add to Home Screen' option." />
              <Step number="3" title="Get updates" desc="The app icon appears on your phone. Open it anytime for fresh tips and tricks." />
            </div>
          </div>
        </section>

        <section className="agency-container py-12 lg:py-16">
          <div className="grid gap-6 rounded-md bg-quaternary p-8 text-primary-foreground md:p-12 lg:grid-cols-2 lg:items-center">
            <div>
              <h2 className="mb-3 text-2xl font-bold text-primary-foreground md:text-3xl">Prefer a PDF?</h2>
              <p className="mb-4 text-sm leading-relaxed text-primary-foreground">You can still download the 13-page insider playbook as a PDF. The app gives you the same content plus ongoing updates and offline access.</p>
              <Link to="/#resources" className="inline-flex items-center gap-2 rounded bg-primary px-6 py-3 text-xs font-semibold text-primary-foreground hover:opacity-90"><FileText size={16} /> Get the PDF playbook</Link>
            </div>
            <div className="flex justify-center lg:justify-end">
              <Link to="/insider" className="inline-flex items-center gap-2 rounded-full bg-white px-8 py-4 text-sm font-bold text-blue-700 hover:bg-blue-50"><Smartphone size={18} /> Open the Insider App →</Link>
            </div>
          </div>
        </section>
      </main>
    </>
  );
  return Transition;
}

export default Resources;

function CategoryCard({ icon: Icon, title, desc, color }) {
  const colors = {
    blue: 'bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400',
    violet: 'bg-violet-50 text-violet-600 dark:bg-violet-950/40 dark:text-violet-400',
    emerald: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400',
    amber: 'bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400',
  };
  return (
    <div className="rounded-lg border border-border bg-card p-5 text-center">
      <div className={`mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full ${colors[color]}`}>
        <Icon size={24} />
      </div>
      <h3 className="mb-1 text-sm font-bold text-foreground">{title}</h3>
      <p className="text-xs text-muted-foreground">{desc}</p>
    </div>
  );
}

function Step({ number, title, desc }) {
  return (
    <div className="text-center">
      <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white">{number}</div>
      <h3 className="mb-1 text-sm font-bold text-foreground">{title}</h3>
      <p className="text-xs text-muted-foreground">{desc}</p>
    </div>
  );
}