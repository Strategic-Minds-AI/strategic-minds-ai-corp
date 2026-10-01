import { useState, useEffect } from 'react';
import { Lightbulb, Shield, Bell } from 'lucide-react';
import InsiderInstallBar from '@/components/insider/InsiderInstallBar';
import InsiderBottomNav from '@/components/insider/InsiderBottomNav';
import InsiderFeed from '@/components/insider/InsiderFeed';
import InsiderLibrary from '@/components/insider/InsiderLibrary';
import InsiderDetail from '@/components/insider/InsiderDetail';
import { Link } from 'react-router-dom';

const SAVED_KEY = 'insider:saved';

export default function InsiderApp() {
  const [tab, setTab] = useState('feed');
  const [selected, setSelected] = useState(null);
  const [saved, setSaved] = useState([]);

  useEffect(() => {
    try { setSaved(JSON.parse(localStorage.getItem(SAVED_KEY) || '[]')); } catch { setSaved([]); }
  }, []);

  const toggleSave = (id) => {
    setSaved(prev => {
      const next = prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id];
      localStorage.setItem(SAVED_KEY, JSON.stringify(next));
      return next;
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <InsiderInstallBar />
      <header className="sticky top-0 z-20 border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-md items-center gap-2 px-4 py-3">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white">
              <Lightbulb size={18} />
            </div>
            <div>
              <p className="text-sm font-bold leading-none text-foreground">Insider</p>
              <p className="text-[10px] text-muted-foreground">Strategic Minds AI</p>
            </div>
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-md px-4 pb-20 pt-4">
        {tab === 'feed' && <InsiderFeed onSelect={setSelected} saved={saved} onToggleSave={toggleSave} />}
        {tab === 'library' && <InsiderLibrary onSelect={setSelected} saved={saved} onToggleSave={toggleSave} />}
        {tab === 'about' && <AboutTab savedCount={saved.length} />}
      </main>
      {selected && <InsiderDetail item={selected} onClose={() => setSelected(null)} saved={saved} onToggleSave={toggleSave} />}
      <InsiderBottomNav tab={tab} onTab={setTab} />
    </div>
  );
}

function AboutTab({ savedCount }) {
  return (
    <div className="space-y-5">
      <div className="rounded-xl bg-gradient-to-br from-blue-600 to-blue-800 p-5 text-white">
        <Lightbulb size={28} className="mb-2" />
        <h2 className="mb-1 text-lg font-bold">Strategic Minds Insider</h2>
        <p className="text-sm text-blue-100">Your pocket guide to business growth, AI strategy, and wealth-building tactics — updated regularly with real, actionable insider knowledge.</p>
      </div>
      <div className="space-y-3">
        <Feature icon={Lightbulb} title="Real insider content" desc="Tips, tricks, and secrets most consultants charge thousands to share — free, no signup wall." />
        <Feature icon={Shield} title="Works offline" desc="Once installed, read content anywhere — no connection needed. New content syncs when you're back online." />
        <Feature icon={Bell} title="Fresh content" desc="We push new tips, tricks, and wealth-building strategies regularly. Open the app to see what's new." />
      </div>
      <div className="rounded-xl border border-border bg-card p-4">
        <p className="text-xs text-muted-foreground">You have <strong className="text-foreground">{savedCount}</strong> saved {savedCount === 1 ? 'item' : 'items'}.</p>
      </div>
      <div className="rounded-xl border border-border bg-muted/50 p-4 text-center">
        <p className="text-xs text-muted-foreground">Want personalized help implementing these strategies?</p>
        <Link to="/contact" className="mt-2 inline-block rounded-full bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700">Book a consultation →</Link>
      </div>
    </div>
  );
}

function Feature({ icon: Icon, title, desc }) {
  return (
    <div className="flex gap-3 rounded-xl border border-border bg-card p-4">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950/40">
        <Icon size={18} />
      </div>
      <div>
        <p className="text-sm font-semibold text-foreground">{title}</p>
        <p className="text-xs text-muted-foreground">{desc}</p>
      </div>
    </div>
  );
}