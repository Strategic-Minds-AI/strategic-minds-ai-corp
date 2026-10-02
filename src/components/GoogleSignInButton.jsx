import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import GoogleIcon from '@/components/GoogleIcon';
import { signInWithGoogle } from '@/lib/supabaseAuthClient';

export default function GoogleSignInButton({ disabled, onError }) {
  const [loading, setLoading] = useState(false);
  const handleSignIn = async () => {
    const framed = window.self !== window.top;
    const signInTab = framed ? window.open('', '_blank') : null;
    onError('');
    setLoading(true);
    try {
      if (framed && !signInTab) throw new Error('Allow popups to continue with Google.');
      if (signInTab) signInTab.opener = null;
      const { data } = await signInWithGoogle();
      if (!data?.url) throw new Error('Google sign-in could not start. Please try again.');
      if (signInTab) signInTab.location.replace(data.url);
      else window.location.assign(data.url);
    } catch (error) {
      signInTab?.close();
      onError(error.message || 'Google sign-in could not start. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  return <Button type="button" variant="outline" className="w-full h-12 text-sm font-medium mb-6" onClick={handleSignIn} disabled={disabled || loading} aria-busy={loading}>
    {loading ? <Loader2 className="w-5 h-5 mr-2 animate-spin motion-reduce:animate-none" aria-hidden="true" /> : <GoogleIcon className="w-5 h-5 mr-2" />}
    {loading ? 'Opening Google…' : 'Continue with Google'}
  </Button>;
}