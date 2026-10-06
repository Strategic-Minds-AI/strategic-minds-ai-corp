import { useEffect, useRef, useState } from 'react';
import { ArrowUp, Mic, Loader2, SlidersHorizontal, Network, Square, PanelRight } from 'lucide-react';
import { presets } from '@/components/swarm/catalog';
export default function PromptComposer({ swarm: s, onParameters, onRuntime }) {
  const [listening, setListening] = useState(false), [voiceError, setVoiceError] = useState('');
  const recognition = useRef(null);
  const Speech = window.SpeechRecognition || window.webkitSpeechRecognition;
  useEffect(() => () => recognition.current?.abort(), []);
  function voice() {
    if (listening) { recognition.current?.stop(); return; }
    const speech = new Speech(); recognition.current = speech; speech.lang = navigator.language || 'en-US';
    speech.onresult = event => s.setPrompt(`${s.prompt} ${event.results[0][0].transcript}`.trim().slice(0,12000));
    speech.onerror = () => { setVoiceError('Microphone unavailable. Please type your objective.'); setListening(false); };
    speech.onend = () => setListening(false); setVoiceError(''); speech.start(); setListening(true);
  }
  return <form onSubmit={e => { e.preventDefault(); s.dispatch(); }} className="rounded-md border bg-card shadow-sm">
    <div className="flex items-center justify-between gap-3 border-b border-border/70 px-4 py-3"><span className="flex items-center gap-2 text-xs text-muted-foreground"><Network size={14} className="text-primary"/>One objective. Many minds.</span><label className="flex items-center gap-1 text-xs"><span className="sr-only">Execution runtime</span><select disabled={s.busy} value={s.runtime} onChange={e => s.setRuntime(e.target.value)} className="max-w-[155px] bg-card text-[11px] text-foreground"><option value="native">Automatic · Base44</option><option value="chatgpt">ChatGPT · via MCP</option></select></label></div>
    <label htmlFor="swarm-prompt" className="sr-only">What should your swarm work on?</label><textarea id="swarm-prompt" value={s.prompt} onChange={e => s.setPrompt(e.target.value)} disabled={s.busy} maxLength={12000} placeholder="What should your swarm work on?" className="min-h-24 w-full resize-y bg-transparent px-4 py-4 text-base leading-6 placeholder:text-muted-foreground focus-visible:ring-inset"/>
    <div className="flex items-center justify-between gap-2 px-3 pb-3"><button type="button" onClick={onParameters} className="flex items-center gap-2 rounded-md px-2 py-1.5 text-[11px] text-muted-foreground hover:bg-secondary"><SlidersHorizontal size={13}/>{presets[s.preset]?.name || 'Parameters'}</button><div className="flex items-center gap-2"><button type="button" onClick={onRuntime} className="swarm-icon-button md:hidden" aria-label="Open MCP runtime status"><PanelRight size={16}/></button>{Speech && <button type="button" disabled={s.busy} onClick={voice} className={`swarm-icon-button ${listening ? 'text-primary' : ''}`} aria-label={listening ? 'Stop dictation' : 'Dictate an objective'}>{listening ? <Square size={15}/> : <Mic size={16}/>}</button>}<button type="submit" disabled={s.busy || !s.prompt.trim() || !s.selected.length} className="flex min-h-9 items-center gap-2 rounded-md bg-primary px-3 text-xs font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-40">{s.busy ? <Loader2 size={14} className="animate-spin"/> : <ArrowUp size={14}/>}<span>{s.busy ? 'Dispatching…' : s.runtime === 'chatgpt' ? 'Save for ChatGPT' : 'Dispatch swarm'}</span></button></div></div>
    {(s.error || voiceError) && <p role="alert" className="border-t px-4 py-3 text-xs text-destructive">{s.error || voiceError}</p>}
  </form>;
}