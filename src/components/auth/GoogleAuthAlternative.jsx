import GoogleSignInButton from '@/components/GoogleSignInButton';
export default function GoogleAuthAlternative({ disabled, onError }) {
  return <div className="mt-6 border-t border-border pt-6"><p className="mb-3 text-center text-xs text-muted-foreground">Or use a Google account</p><GoogleSignInButton disabled={disabled} onError={onError}/><p className="mb-0 text-center text-xs leading-relaxed text-muted-foreground">If Google cannot finish signing in, use the email and password form above.</p></div>;
}