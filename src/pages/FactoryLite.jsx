import { useState } from 'react';
import { Layers3, Loader2, Rocket, ShieldCheck } from 'lucide-react';
import { enqueueWebsiteBatch } from '@/lib/unifiedFactoryClient';

export default function FactoryLite() {
  const [raw, setRaw] = useState('');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const enqueue = async () => {
    const targets = raw.split('\n').map((v) => v.trim()).filter(Boolean).map((business_name) => ({ business_name }));
    if (!targets.length) return;
    setBusy(true); setError('');
    try { setResult(await enqueueWebsiteBatch({ targets })); }
    catch (e) { setError(e.message || 'Could not queue batch'); }
    finally { setBusy(false); }
  };

  return (
    <main className="min-h-screen bg-[#05070b] p-6 text-white">
      <div className="mx-auto max-w-5xl">
        <div className="flex items-start gap-4">
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-cyan-300/10 text-cyan-300"><Layers3 /></div>
          <div>
            <div className="text-[10px] font-black tracking-[.22em] text-cyan-300">DIGITAL DOMINANCE · SIMPLIFIED</div>
            <h1 className="mt-2 text-4xl font-black tracking-[-.04em]">Website Factory Queue</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">Turn a list of real businesses or approved market targets into deterministic website build jobs. This screen queues work; it does not pretend queued sites are already built or deployed.</p>
          </div>
        </div>

        <div className="mt-8 grid gap-5 lg:grid-cols-[1.15fr_.85fr]">
          <section className="rounded-[28px] border border-white/10 bg-[#09131d] p-6">
            <label className="text-xs font-black text-slate-300">One target per line</label>
            <textarea value={raw} onChange={(e) => setRaw(e.target.value)} rows={16} placeholder={"Acme Roofing\nSmith Injury Law\nPalm Beach Plumbing"} className="mt-3 w-full rounded-2xl border border-white/10 bg-black/20 p-4 text-sm outline-none focus:border-cyan-300/30" />
            <button onClick={enqueue} disabled={busy || !raw.trim()} className="mt-4 inline-flex items-center gap-2 rounded-full bg-cyan-300 px-5 py-3 text-sm font-black text-slate-950 disabled:opacity-40">
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Rocket className="h-4 w-4" />} Queue batch
            </button>
            {error && <div className="mt-4 rounded-2xl border border-red-300/20 bg-red-300/5 p-4 text-sm text-red-200">{error}</div>}
            {result && <div className="mt-4 rounded-2xl border border-emerald-300/20 bg-emerald-300/5 p-4 text-sm text-emerald-100"><strong>{result.queued} targets queued.</strong><br/>Batch: {result.batch_id}</div>}
          </section>

          <aside className="rounded-[28px] border border-cyan-300/12 bg-cyan-300/[.035] p-6">
            <ShieldCheck className="h-6 w-6 text-cyan-300" />
            <h2 className="mt-4 text-xl font-black">Scale law</h2>
            <p className="mt-3 text-sm leading-6 text-slate-400">Large runs are chunked into durable jobs with idempotency keys, leases, retries, independent validation, and provider quotas. The architecture can expand horizontally, but “millions” is a throughput target that must be proven by staged load tests, not a promise.</p>
            <div className="mt-5 space-y-3 text-xs text-slate-400">
              <div>Canary → small batch → medium batch → large batch</div>
              <div>Preview first, production release gated</div>
              <div>Measure cost/site, validation rate, failure rate and time-to-preview</div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
