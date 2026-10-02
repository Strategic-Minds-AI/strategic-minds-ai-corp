import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Loader2, LogIn } from 'lucide-react';
import AuthLayout from '@/components/AuthLayout';
import { useAuth } from '@/lib/AuthContext';
import { getSession } from '@/lib/supabaseAuthClient';
import { safeReturnTo } from '@/lib/authReturnTo';

export default function AuthCallback() {
  const [error, setError] = useState('');
  const { authError } = useAuth();
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const fragment = new URLSearchParams(window.location.hash.slice(1));
        const providerError = fragment.get('error_description') || urlParams.get('error_description') || fragment.get('error') || urlParams.get('error');
        if (providerError) throw new Error(providerError);
        if (authError) throw new Error(authError.message);
        const session = await getSession();
        if (!session) throw new Error('Google sign-in did not return a session. Please try signing in again.');
        if (active) window.location.replace(safeReturnTo());
      } catch (failure) {
        if (active) setError(failure.message || 'Sign-in could not finish. Please try again.');
      }
    })();
    return () => { active = false; };
  }, [authError]);
  return <AuthLayout icon={LogIn} title={error ? 'Sign-in could not finish' : 'Completing sign-in'} subtitle={error ? 'Your portal has not been opened.' : 'Saving your session and opening your portal.'}>
    {error ? <>
      <p role="alert" className="text-sm text-destructive">{error}</p>
      <Link className="agency-button mt-6 w-full" to={`/login?returnTo=${encodeURIComponent(safeReturnTo())}`}>Try signing in again</Link>
    </> : <div role="status" className="flex items-center justify-center gap-3 text-sm text-foreground">
      <Loader2 className="h-5 w-5 animate-spin motion-reduce:animate-none" aria-hidden="true" /> Completing Google sign-in…
    </div>}
  </AuthLayout>;
}