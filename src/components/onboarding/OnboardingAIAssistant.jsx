import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Loader2, Send, Lightbulb, AlertTriangle, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { base44 } from '@/api/base44Client';

const QUICK_PROMPTS = [
  'What should I prioritize for this client?',
  'Generate a kickoff meeting agenda',
  'What are the key risks with this onboarding?',
  'Suggest a communication plan',
];

export default function OnboardingAIAssistant({ client }) {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [error, setError] = useState('');

  async function askAI(question) {
    const q = question || prompt;
    if (!q) return;
    setLoading(true); setError(''); setAnalysis(null);
    try {
      const res = await base44.functions.invoke('onboardingWorkspace', {
        action: 'aiAssist',
        prompt: q,
        context: {
          company_name: client.company_name,
          contact_name: client.contact_name,
          service_type: client.service_type,
          contract_value: client.contract_value,
          onboarding_status: client.onboarding_status,
          industry: client.industry,
          website: client.website,
        }
      });
      if (res.data?.error) throw new Error(res.data.error);
      setAnalysis(res.data.analysis);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }

  return (
    <div className="bg-gradient-to-br from-primary/5 to-card border border-primary/20 rounded-xl p-5 space-y-4">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary"><Sparkles size={16} /></div>
        <div>
          <span className="text-sm font-semibold text-foreground">AI Onboarding Assistant</span>
          <p className="text-[11px] text-muted-foreground">Strategic guidance powered by AI</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {QUICK_PROMPTS.map(q => (
          <button key={q} onClick={() => { setPrompt(q); askAI(q); }} className="text-[11px] bg-muted hover:bg-primary/10 hover:text-primary text-muted-foreground rounded-full px-3 py-1.5 transition-colors flex items-center gap-1">
            <Lightbulb size={11} /> {q}
          </button>
        ))}
      </div>

      <div className="flex gap-2">
        <Textarea value={prompt} onChange={e => setPrompt(e.target.value)} placeholder="Ask anything about this client's onboarding..." className="text-sm bg-muted border-border resize-none" rows={2} onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); askAI(); } }} />
        <Button size="sm" onClick={() => askAI()} disabled={loading || !prompt} className="self-end gap-1.5">
          {loading ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
        </Button>
      </div>

      {error && <div className="flex items-start gap-2 text-xs text-destructive bg-destructive/5 rounded-lg p-3"><AlertTriangle size={14} className="flex-shrink-0 mt-0.5" />{error}</div>}

      <AnimatePresence>
        {analysis && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
            {analysis.summary && (
              <div className="bg-background/60 rounded-lg p-3 border border-border">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5">Summary</p>
                <p className="text-sm text-foreground/90 leading-relaxed">{analysis.summary}</p>
              </div>
            )}
            {analysis.recommendations?.length > 0 && (
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-primary mb-2">Recommendations</p>
                <ul className="space-y-1.5">{analysis.recommendations.map((r, i) => <li key={i} className="text-xs text-foreground/80 flex items-start gap-2"><ArrowRight size={12} className="text-primary mt-0.5 flex-shrink-0" />{r}</li>)}</ul>
              </div>
            )}
            {analysis.risk_flags?.length > 0 && (
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-destructive mb-2">Risk Flags</p>
                <ul className="space-y-1.5">{analysis.risk_flags.map((r, i) => <li key={i} className="text-xs text-foreground/80 flex items-start gap-2"><AlertTriangle size={12} className="text-destructive mt-0.5 flex-shrink-0" />{r}</li>)}</ul>
              </div>
            )}
            {analysis.next_steps?.length > 0 && (
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-chart-2 mb-2">Next Steps</p>
                <ul className="space-y-1.5">{analysis.next_steps.map((s, i) => <li key={i} className="text-xs text-foreground/80 flex items-start gap-2"><ArrowRight size={12} className="text-chart-2 mt-0.5 flex-shrink-0" />{s}</li>)}</ul>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}