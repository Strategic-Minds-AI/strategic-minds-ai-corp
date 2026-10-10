import { useState } from 'react';
import { Loader2, Rocket, CheckCircle2, AlertCircle, ExternalLink, ShieldCheck, Zap, Eye } from 'lucide-react';
import { base44 } from '@/api/base44Client';

const STEP_ICONS = { generate: Zap, github: ShieldCheck, vercel: Rocket, railway: Rocket, supabase: ShieldCheck };

export default function GPTPipeline() {
  const [command, setCommand] = useState('');
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [secrets, setSecrets] = useState(null);
  const [verifying, setVerifying] = useState(false);

  const runPipeline = async () => {
    if (command.trim().length < 10) return;
    setRunning(true);
    setError(null);
    setResult(null);
    try {
      const res = await base44.functions.invoke('gptProvisionPipeline', { action: 'run', command: command.trim() });
      if (res.data?.error) throw new Error(res.data.error);
      setResult(res.data);
    } catch (e) {
      setError(e.message);
    }
    setRunning(false);
  };

  const verifySecrets = async () => {
    setVerifying(true);
    try {
      const res = await base44.functions.invoke('gptProvisionPipeline', { action: 'verify' });
      setSecrets(res.data?.secrets || null);
    } catch (e) {
      setError(e.message);
    }
    setVerifying(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-4xl px-6 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">GPT Provision Pipeline</h1>
          <p className="mt-2 text-sm text-muted-foreground">Command GPT to generate a website, then auto-provision it to GitHub, Vercel, Railway, and Supabase — all in one step.</p>
        </div>

        {/* Command box */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">Your command</label>
          <textarea
            value={command}
            onChange={e => setCommand(e.target.value)}
            placeholder="e.g. Build a modern website for a plumbing company in Miami called 'Miami Pipe Pros' with services, testimonials, and a contact form"
            rows={3}
            className="w-full resize-none rounded-lg border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <div className="mt-4 flex items-center gap-3">
            <button
              onClick={runPipeline}
              disabled={running || command.trim().length < 10}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-50"
            >
              {running ? <Loader2 className="h-4 w-4 animate-spin" /> : <Rocket className="h-4 w-4" />}
              {running ? 'Running pipeline…' : 'Run Full Pipeline'}
            </button>
            <button
              onClick={verifySecrets}
              disabled={verifying}
              className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-foreground hover:bg-muted disabled:opacity-50"
            >
              {verifying ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
              Verify Secrets
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mt-4 flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-4">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        {/* Pipeline steps */}
        {result?.steps && (
          <div className="mt-6 space-y-2">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Pipeline progress</h2>
            {result.steps.map((step, i) => {
              const Icon = STEP_ICONS[step.step] || Zap;
              return (
                <div key={i} className="flex items-center gap-3 rounded-lg border border-border bg-card p-3">
                  <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${step.status === 'completed' ? 'bg-green-500/10 text-green-600' : step.status === 'failed' ? 'bg-destructive/10 text-destructive' : 'bg-primary/10 text-primary'}`}>
                    {step.status === 'running' ? <Loader2 className="h-4 w-4 animate-spin" /> : step.status === 'completed' ? <CheckCircle2 className="h-4 w-4" /> : step.status === 'failed' ? <AlertCircle className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium capitalize text-foreground">{step.step}</p>
                    {step.detail && typeof step.detail === 'object' && (
                      <p className="text-xs text-muted-foreground">{JSON.stringify(step.detail)}</p>
                    )}
                    {step.detail && typeof step.detail === 'string' && (
                      <p className="text-xs text-muted-foreground">{step.detail}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Results */}
        {result?.ok && (
          <div className="mt-6 space-y-4">
            <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
              <h2 className="mb-4 text-lg font-bold text-foreground">{result.website?.title || 'Website generated'}</h2>
              <p className="mb-4 text-sm text-muted-foreground">{result.website?.description}</p>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {result.github?.url && (
                  <a href={result.github.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 rounded-lg border border-border p-3 text-sm text-foreground hover:bg-muted">
                    <ShieldCheck className="h-4 w-4 text-primary" /> GitHub repo <ExternalLink className="ml-auto h-3 w-3 text-muted-foreground" />
                  </a>
                )}
                {result.vercel?.deployment_url && (
                  <a href={result.vercel.deployment_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 rounded-lg border border-border p-3 text-sm text-foreground hover:bg-muted">
                    <Rocket className="h-4 w-4 text-primary" /> Vercel site <ExternalLink className="ml-auto h-3 w-3 text-muted-foreground" />
                  </a>
                )}
                {result.railway?.url && (
                  <a href={result.railway.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 rounded-lg border border-border p-3 text-sm text-foreground hover:bg-muted">
                    <Rocket className="h-4 w-4 text-primary" /> Railway project <ExternalLink className="ml-auto h-3 w-3 text-muted-foreground" />
                  </a>
                )}
                {result.supabase?.table && (
                  <div className="flex items-center gap-2 rounded-lg border border-border p-3 text-sm text-foreground">
                    <ShieldCheck className="h-4 w-4 text-primary" /> Supabase table: {result.supabase.table}
                  </div>
                )}
              </div>
            </div>

            {/* Preview */}
            {result.preview_html && (
              <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
                <div className="flex items-center justify-between border-b border-border px-4 py-2">
                  <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Website preview</span>
                  <Eye className="h-4 w-4 text-muted-foreground" />
                </div>
                <iframe srcDoc={result.preview_html} title="Website preview" className="h-[500px] w-full border-0" sandbox="allow-same-origin allow-scripts allow-forms allow-popups" />
              </div>
            )}
          </div>
        )}

        {/* Secret verification */}
        {secrets && (
          <div className="mt-6 rounded-2xl border border-border bg-card p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-bold text-foreground">Secret verification</h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {Object.entries(secrets).map(([name, info]) => (
                <div key={name} className="flex items-center gap-2 rounded-lg border border-border p-3">
                  {info.ok || info.configured ? <CheckCircle2 className="h-4 w-4 text-green-600" /> : <AlertCircle className="h-4 w-4 text-destructive" />}
                  <div>
                    <p className="text-xs font-semibold capitalize text-foreground">{name}</p>
                    <p className="text-[10px] text-muted-foreground">{info.ok ? 'live' : info.configured ? 'set' : 'failed'}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}