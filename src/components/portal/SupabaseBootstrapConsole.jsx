import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, KeyRound, CheckCircle2, XCircle, AlertTriangle, ExternalLink, ShieldCheck } from 'lucide-react';

const STATUS_ICON = {
  success: CheckCircle2,
  failed: XCircle,
  warning: AlertTriangle,
  skipped: AlertTriangle,
  pending: Loader2,
};

const STATUS_COLOR = {
  success: 'text-green-600',
  failed: 'text-destructive',
  warning: 'text-amber-600',
  skipped: 'text-muted-foreground',
  pending: 'text-muted-foreground',
};

export default function SupabaseBootstrapConsole() {
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const handleBootstrap = async () => {
    setError('');
    setResult(null);
    if (!token.trim()) {
      setError('Paste your Supabase access token first.');
      return;
    }
    setLoading(true);
    try {
      const res = await base44.functions.invoke('bootstrapSupabase', { supabaseAccessToken: token.trim() });
      setResult(res.data);
      if (res.data?.error) setError(res.data.error);
    } catch (e) {
      setError(e.message || 'Bootstrap failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="rounded-lg border border-border bg-card p-6">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <ShieldCheck className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">Supabase bootstrap</h2>
            <p className="text-sm text-muted-foreground">Configure auth, Google Sign-In, and the profiles table in one step.</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="supabase-pat">Supabase access token</Label>
            <div className="relative">
              <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" aria-hidden="true" />
              <Input
                id="supabase-pat"
                type="password"
                autoComplete="off"
                placeholder="sbp_••••••••••••••••••••••••••"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                className="pl-10 h-12 font-mono text-sm"
                disabled={loading}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Create one at{' '}
              <a href="https://supabase.com/dashboard/account/tokens" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-primary hover:underline">
                supabase.com/dashboard/account/tokens <ExternalLink className="h-3 w-3" />
              </a>
              . The token is used once to configure your project and is never stored.
            </p>
          </div>

          {error && (
            <div role="alert" className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <Button onClick={handleBootstrap} disabled={loading || !token.trim()} className="w-full h-12">
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Bootstrapping…
              </>
            ) : (
              'Bootstrap system'
            )}
          </Button>
        </div>
      </div>

      {result?.steps && (
        <div className="rounded-lg border border-border bg-card p-6">
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-widest text-muted-foreground">Progress</h3>
          <div className="space-y-3">
            {result.steps.map((s, i) => {
              const Icon = STATUS_ICON[s.status] || AlertTriangle;
              const color = STATUS_COLOR[s.status] || 'text-muted-foreground';
              return (
                <div key={i} className="flex items-start gap-3">
                  <Icon className={`h-5 w-5 shrink-0 ${color} ${s.status === 'pending' ? 'animate-spin' : ''}`} />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground">{s.step}</p>
                    {s.detail && <p className={`text-xs ${color}`}>{s.detail}</p>}
                  </div>
                </div>
              );
            })}
          </div>
          {result.complete && !result.error && (
            <div className="mt-4 rounded-lg bg-green-50 p-3 text-sm text-green-700 dark:bg-green-950 dark:text-green-300">
              All steps completed. Google Sign-In should now work — try signing in.
            </div>
          )}
        </div>
      )}

      <div className="rounded-lg border border-border bg-muted/30 p-4 text-xs text-muted-foreground">
        <p className="mb-2 font-semibold text-foreground">What this does</p>
        <ul className="space-y-1">
          <li>• Pushes your Google OAuth client ID and secret into Supabase auth config</li>
          <li>• Sets the site URL and allowed redirect URLs for the app</li>
          <li>• Creates the <code className="rounded bg-muted px-1">profiles</code> table with an auto-trigger for new sign-ups</li>
          <li>• Verifies Google accepts the credentials before finishing</li>
        </ul>
      </div>
    </div>
  );
}