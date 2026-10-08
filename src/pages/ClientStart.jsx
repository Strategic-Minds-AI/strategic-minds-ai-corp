import { useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet';
import { useSearchParams } from 'react-router-dom';
import { Mic, Send, Sparkles, ShieldCheck } from 'lucide-react';
import { edenClientTurn } from '@/lib/unifiedFactoryClient';

const FIELD_COUNT = 9;

export default function ClientStart() {
  const [params] = useSearchParams();
  const token = params.get('t') || '';
  const [messages, setMessages] = useState([]);
  const [answers, setAnswers] = useState({});
  const [currentField, setCurrentField] = useState('');
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [complete, setComplete] = useState(false);
  const [buildId, setBuildId] = useState('');
  const [error, setError] = useState('');
  const [started, setStarted] = useState(false);

  const progress = useMemo(() => {
    const filled = Object.values(answers || {}).filter((v) => String(v || '').trim()).length;
    return Math.min(100, Math.max(6, Math.round((filled / FIELD_COUNT) * 100)));
  }, [answers]);

  useEffect(() => {
    document.title = 'Meet Eden Skye | Strategic Minds AI';
  }, []);

  const speak = (value) => {
    if (!('speechSynthesis' in window) || !value) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(value);
    const voices = window.speechSynthesis.getVoices();
    u.voice = voices.find((v) => /aria|samantha|jenny|zira|ava|serena/i.test(v.name) && /^en/i.test(v.lang || '')) || voices.find((v) => /^en/i.test(v.lang || '')) || null;
    u.rate = 1.02;
    u.pitch = 1.03;
    window.speechSynthesis.speak(u);
  };

  const call = async (message = '') => {
    if (!token) return;
    setBusy(true);
    setError('');
    try {
      const result = await edenClientTurn({ token, message, current_field: currentField, answers });
      setStarted(true);
      setAnswers(result.answers || {});
      setCurrentField(result.next_field || '');
      setComplete(Boolean(result.completed));
      setBuildId(result.build_id || '');
      setMessages((items) => [...items, { role: 'assistant', content: result.reply }]);
      speak(result.reply);
    } catch (e) {
      setError(e.message || 'Eden could not connect.');
    } finally {
      setBusy(false);
    }
  };

  const send = async () => {
    const value = text.trim();
    if (!value || busy) return;
    setMessages((items) => [...items, { role: 'user', content: value }]);
    setText('');
    await call(value);
  };

  const listen = () => {
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Recognition) return;
    const r = new Recognition();
    r.lang = 'en-US';
    r.interimResults = false;
    r.onresult = (event) => setText(event.results?.[0]?.[0]?.transcript || '');
    r.start();
  };

  if (!token) {
    return (
      <main className="min-h-screen bg-[#04070b] text-white grid place-items-center px-6">
        <div className="max-w-xl text-center">
          <ShieldCheck className="mx-auto h-9 w-9 text-cyan-300" />
          <h1 className="mt-5 text-4xl font-black">Secure onboarding link required.</h1>
          <p className="mt-4 text-slate-400">Your Strategic Minds AI project link is created after your engagement is opened. Please use the private URL we sent you.</p>
        </div>
      </main>
    );
  }

  return (
    <>
      <Helmet>
        <title>Meet Eden Skye | Strategic Minds AI</title>
        <meta name="robots" content="noindex,nofollow" />
      </Helmet>
      <main className="min-h-screen bg-[#04070b] text-white">
        <div className="mx-auto grid min-h-screen max-w-7xl gap-8 px-5 py-8 lg:grid-cols-[.8fr_1.2fr] lg:items-center">
          <section className="relative overflow-hidden rounded-[34px] border border-cyan-300/15 bg-[radial-gradient(circle_at_60%_20%,rgba(0,151,255,.26),transparent_30%),linear-gradient(160deg,#0a1725,#05080d)] p-8 shadow-[0_40px_120px_rgba(0,112,255,.18)]">
            <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full border border-cyan-300/15 shadow-[0_0_100px_rgba(0,147,255,.15)]" />
            <div className="relative">
              <div className="text-[10px] font-black tracking-[.25em] text-cyan-300">STRATEGIC MINDS AI</div>
              <h1 className="mt-4 text-6xl font-black leading-[.88] tracking-[-.06em]">Meet<br/><span className="text-cyan-300">Eden Skye.</span></h1>
              <p className="mt-6 max-w-md text-slate-400">I’m your AI client concierge. I’ll learn what you’re building, capture the visual direction, and hand a structured build packet to the Strategic Minds factory.</p>
              <div className="mt-10 rounded-3xl border border-white/10 bg-black/25 p-5">
                <div className="flex items-center gap-3">
                  <div className="grid h-16 w-16 place-items-center rounded-2xl border border-cyan-300/20 bg-cyan-300/5 text-2xl font-black text-cyan-200">ES</div>
                  <div>
                    <div className="font-black">Eden Skye</div>
                    <div className="text-xs text-cyan-200/70">AI Client Concierge</div>
                  </div>
                </div>
                <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/5">
                  <div className="h-full bg-gradient-to-r from-cyan-300 to-blue-600 transition-all" style={{ width: progress + '%' }} />
                </div>
                <div className="mt-2 text-xs text-slate-500">{complete ? 'Business Genome captured' : 'Onboarding in progress'}</div>
              </div>
              <div className="mt-5 flex items-start gap-2 text-xs text-slate-500"><Sparkles className="mt-0.5 h-4 w-4 text-cyan-300" /> Eden is an AI. She will never pretend a website, email, payment, or deployment happened until the system has evidence.</div>
            </div>
          </section>

          <section className="flex min-h-[720px] flex-col overflow-hidden rounded-[34px] border border-white/10 bg-[#07111b]">
            <header className="border-b border-white/10 px-6 py-5">
              <div className="font-black">Project conversation</div>
              <div className="mt-1 text-xs text-slate-500">Your answers sync into the Strategic Minds build pipeline.</div>
            </header>

            <div className="flex-1 space-y-4 overflow-y-auto p-6">
              {!started && (
                <div className="grid min-h-[420px] place-items-center text-center">
                  <div>
                    <Sparkles className="mx-auto h-8 w-8 text-cyan-300" />
                    <h2 className="mt-4 text-2xl font-black">Ready when you are.</h2>
                    <p className="mt-2 max-w-md text-sm text-slate-500">Tap below and I’ll ask a short set of questions. No giant forms, no technical homework.</p>
                    <button onClick={() => call('')} disabled={busy} className="mt-6 rounded-full bg-cyan-300 px-6 py-3 text-sm font-black text-slate-950 disabled:opacity-50">Start with Eden</button>
                  </div>
                </div>
              )}

              {messages.map((m, index) => (
                <div key={index} className={m.role === 'user' ? 'ml-auto max-w-[82%] rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 px-4 py-3 text-sm' : 'max-w-[82%] rounded-2xl border border-cyan-300/10 bg-[#0d263b] px-4 py-3 text-sm'}>
                  {m.content}
                </div>
              ))}

              {complete && (
                <div className="rounded-2xl border border-emerald-300/20 bg-emerald-300/5 p-5 text-sm text-emerald-100">
                  <div className="font-black">Your intake is complete.</div>
                  <div className="mt-1 text-emerald-100/70">Your project has been queued for the next governed build step{buildId ? ' under build ' + buildId : ''}. We will not claim it is live until validation and release are complete.</div>
                </div>
              )}
              {error && <div className="rounded-2xl border border-red-300/20 bg-red-300/5 p-4 text-sm text-red-200">{error}</div>}
            </div>

            {!complete && started && (
              <div className="border-t border-white/10 p-4">
                <div className="flex gap-3">
                  <button onClick={listen} className="grid h-12 w-12 place-items-center rounded-2xl border border-white/10 text-cyan-200"><Mic className="h-4 w-4" /></button>
                  <input value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && send()} placeholder="Tell Eden…" className="min-w-0 flex-1 rounded-2xl border border-white/10 bg-black/20 px-4 outline-none focus:border-cyan-300/30" />
                  <button onClick={send} disabled={busy || !text.trim()} className="grid h-12 w-12 place-items-center rounded-2xl bg-cyan-300 text-slate-950 disabled:opacity-40"><Send className="h-4 w-4" /></button>
                </div>
              </div>
            )}
          </section>
        </div>
      </main>
    </>
  );
}
