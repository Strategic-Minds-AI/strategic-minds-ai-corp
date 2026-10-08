import { useState } from 'react';
import { CalendarClock, Loader2, Send, ShieldCheck, Video } from 'lucide-react';
import { enqueueSocialContent } from '@/lib/unifiedFactoryClient';

const NETWORKS = ['instagram','facebook','tiktok','youtube','linkedin','google_business'];

export default function SocialOS() {
  const [brief, setBrief] = useState('');
  const [networks, setNetworks] = useState(['instagram','facebook','tiktok']);
  const [scheduleAt, setScheduleAt] = useState('');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const toggle = (network) => setNetworks((items) => items.includes(network) ? items.filter((x) => x !== network) : [...items, network]);

  const queue = async () => {
    if (!brief.trim()) return;
    setBusy(true); setError('');
    try { setResult(await enqueueSocialContent({ brief, networks, schedule_at: scheduleAt, live_publish: false })); }
    catch (e) { setError(e.message || 'Could not queue social content'); }
    finally { setBusy(false); }
  };

  return (
    <main className="min-h-screen bg-[#05070b] p-6 text-white">
      <div className="mx-auto max-w-6xl">
        <div className="flex items-start gap-4">
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-fuchsia-400/10 text-fuchsia-300"><Video /></div>
          <div>
            <div className="text-[10px] font-black tracking-[.22em] text-cyan-300">SOCIAL OPERATING SYSTEM</div>
            <h1 className="mt-2 text-4xl font-black tracking-[-.04em]">Create → Review → Schedule → Learn</h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-400">Queue cross-channel content, image/carousel concepts, and short-video work for the Super Agent social pipeline. The worker target is Metricool for scheduling and HeyGen for video generation, with analytics feeding the next cycle.</p>
          </div>
        </div>

        <div className="mt-8 grid gap-5 lg:grid-cols-[1.1fr_.9fr]">
          <section className="rounded-[28px] border border-white/10 bg-[#09131d] p-6">
            <label className="text-xs font-black text-slate-300">Campaign brief</label>
            <textarea value={brief} onChange={(e) => setBrief(e.target.value)} rows={10} placeholder="Example: Introduce Strategic Minds AI's new Eden Skye onboarding experience. Focus on how a 15-minute consultation becomes a personalized AI-powered build." className="mt-3 w-full rounded-2xl border border-white/10 bg-black/20 p-4 text-sm outline-none focus:border-cyan-300/30" />

            <div className="mt-5">
              <div className="text-xs font-black text-slate-300">Channels</div>
              <div className="mt-3 flex flex-wrap gap-2">
                {NETWORKS.map((network) => <button key={network} onClick={() => toggle(network)} className={networks.includes(network) ? 'rounded-full bg-cyan-300 px-3 py-2 text-xs font-black text-slate-950' : 'rounded-full border border-white/10 px-3 py-2 text-xs text-slate-400'}>{network}</button>)}
              </div>
            </div>

            <label className="mt-5 block text-xs font-black text-slate-300">Preferred schedule time (optional)</label>
            <div className="mt-2 flex items-center gap-2 rounded-2xl border border-white/10 bg-black/20 px-3">
              <CalendarClock className="h-4 w-4 text-cyan-300" />
              <input type="datetime-local" value={scheduleAt} onChange={(e) => setScheduleAt(e.target.value)} className="w-full bg-transparent py-3 text-sm outline-none" />
            </div>

            <button onClick={queue} disabled={busy || !brief.trim()} className="mt-5 inline-flex items-center gap-2 rounded-full bg-cyan-300 px-5 py-3 text-sm font-black text-slate-950 disabled:opacity-40">
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} Queue for review
            </button>
            {error && <div className="mt-4 rounded-2xl border border-red-300/20 bg-red-300/5 p-4 text-sm text-red-200">{error}</div>}
            {result && <div className="mt-4 rounded-2xl border border-emerald-300/20 bg-emerald-300/5 p-4 text-sm text-emerald-100">Social pipeline queued for review. Job: {result.job_id || 'pending receipt'}</div>}
          </section>

          <aside className="rounded-[28px] border border-cyan-300/12 bg-cyan-300/[.035] p-6">
            <ShieldCheck className="h-6 w-6 text-cyan-300" />
            <h2 className="mt-4 text-xl font-black">Publishing policy</h2>
            <p className="mt-3 text-sm leading-6 text-slate-400">This V1 creates review-ready work. Live posting and autonomous replies only become eligible inside an approved channel/content policy envelope with account scope, daily limits, response rules, opt-out handling, escalation rules and a kill switch.</p>
          </aside>
        </div>
      </div>
    </main>
  );
}
