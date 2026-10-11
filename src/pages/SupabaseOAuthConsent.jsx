import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, CheckCircle2, Loader2, ShieldCheck, ShieldX } from 'lucide-react';
import AuthLayout from '@/components/AuthLayout';
import { Button } from '@/components/ui/button';
import { getSupabase } from '@/lib/supabaseClient';
import { approvedOAuthRedirect, consentLoginPath, requestedScopes, validAuthorizationId } from '@/lib/supabaseOAuthConsentPolicy';

export default function SupabaseOAuthConsent() {
  const id = useMemo(() => new URLSearchParams(window.location.search).get('authorization_id'), []);
  const [details, setDetails] = useState(null);
  const [status, setStatus] = useState('checking');
  const [error, setError] = useState('');
  const [pending, setPending] = useState('');
  useEffect(() => {
    let active = true;
    async function load() {
      if (!validAuthorizationId(id)) {
        if (active) { setStatus('error'); setError('Invalid authorization link. Restart connection from ChatGPT.'); }
        return;
      }
      try {
        const supabase = await getSupabase();
        const { data: identity, error: identityError } = await supabase.auth.getUser();
        if (identityError || !identity?.user) {
          window.location.replace(consentLoginPath(id));
          return;
        }
        const { data, error: oauthError } = await supabase.auth.oauth.getAuthorizationDetails(id);
        if (oauthError || !data) throw new Error(oauthError?.message || 'Unable to verify OAuth request.');
        if ('redirect_url' in data && !('authorization_id' in data)) {
          const callback = approvedOAuthRedirect(data.redirect_url, window.location.origin);
          if (!callback) throw new Error('OAuth callback rejected.');
          window.location.assign(callback);
          return;
        }
        if (data.authorization_id !== id || !data.client?.name) {
          throw new Error('OAuth request did not match the signed authorization.');
        }
        if (active) { setDetails(data); setStatus('ready'); }
      } catch (err) {
        if (active) { setError(err?.message || 'Authorization unavailable.'); setStatus('error'); }
      }
    }
    load();
    return () => { active = false; };
  }, [id]);
  const decide = async action => {
    if (!details || status !== 'ready' || pending) return;
    setPending(action); setError('');
    try {
      const supabase = await getSupabase();
      const { data, error: authError } = action === 'approve'
        ? await supabase.auth.oauth.approveAuthorization(id)
        : await supabase.auth.oauth.denyAuthorization(id);
      if (authError || !data) throw new Error(authError?.message || 'Consent decision could not be completed.');
      const callback = approvedOAuthRedirect(data.redirect_url, window.location.origin);
      if (!callback) throw new Error('OAuth destination rejected.');
      window.location.assign(callback);
    } catch (err) {
      setError(err?.message || 'Authorization failed. Restart connection if this request expired.');
      setPending('');
    }
  };
  return <AuthLayout icon={ShieldCheck} title="Authorize AI access" subtitle="Review the permissions requested by a connected application.">
    {status === 'checking' && <p role="status" className="flex items-center gap-2 py-6 text-sm text-muted-foreground"><Loader2 size={18} className="animate-spin"/> Verifying your session and request…</p>}
    {status === 'error' && <p role="alert" className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">{error}</p>}
    {status === 'ready' && details && <>
      <div className="rounded-xl border border-border bg-muted/30 p-5">
        <h2 className="flex items-center gap-2 text-lg font-semibold"><ShieldCheck size={20} className="text-primary"/> {details.client.name}</h2>
        <p className="mt-2 text-sm text-muted-foreground">Requests access to your Strategic Minds AI account.</p>
        <p className="mt-3 break-all text-xs text-muted-foreground">Registered redirect: {details.redirect_uri || 'Provided by Supabase'}</p>
        <h3 className="mt-4 text-sm font-semibold">Requested OAuth scopes</h3>
        <ul className="mt-2 space-y-2 text-sm">{requestedScopes(details.scope).map(scope =>
          <li key={scope} className="flex items-center gap-2"><CheckCircle2 size={16} className="text-primary"/>{scope}</li>)}</ul>
        {!requestedScopes(details.scope).length && <p className="mt-2 text-xs text-muted-foreground">No scopes returned. Approve only if this client is trusted.</p>}
      </div>
      <p className="mt-4 text-xs text-muted-foreground">Passwords remain with their providers. Administrative writes still require their own authorization.</p>
      {error && <p role="alert" className="mt-4 text-sm text-destructive">{error}</p>}
      <div className="mt-5 grid grid-cols-2 gap-3">
        <Button type="button" variant="outline" className="h-12" disabled={Boolean(pending)} onClick={() => decide('deny')}><ShieldX size={16} className="mr-2"/>Deny</Button>
        <Button type="button" className="h-12" disabled={Boolean(pending)} onClick={() => decide('approve')}>{pending === 'approve' ? <Loader2 size={16} className="mr-2 animate-spin"/> : <ArrowRight size={16} className="mr-2"/>}Approve</Button>
      </div>
    </>}
  </AuthLayout>;
}
