import LegacyOAuthConsent from '@/pages/OAuthConsent';
import SupabaseOAuthConsent from '@/pages/SupabaseOAuthConsent';
import { consentProtocol } from '@/lib/supabaseOAuthConsentPolicy';

// Leave existing Base44 consent handles intact while adding Supabase OAuth 2.1.
export default function OAuthConsentRouter() {
  return consentProtocol(window.location.search) === 'supabase'
    ? <SupabaseOAuthConsent />
    : <LegacyOAuthConsent />;
}
