export async function checkGoogleAuthCredentials(clientId, clientSecret, projectRef) {
  if (!clientId || !clientSecret) return { state: 'missing', detail: 'Google sign-in needs a matching client ID and client secret.' };
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    signal: AbortSignal.timeout(10000),
    body: new URLSearchParams({ client_id: clientId.split(',')[0].trim(), client_secret: clientSecret, redirect_uri: `https://${projectRef}.supabase.co/auth/v1/callback`, grant_type: 'authorization_code', code: `credential-check-${crypto.randomUUID()}` }),
  });
  const result = await response.json();
  if (result.error === 'invalid_grant') return { state: 'ready', detail: 'Google recognizes the client credentials. A fresh sign-in is still required.' };
  if (result.error === 'invalid_client') return { state: 'invalid', detail: 'Google rejected the client credentials. Replace the client ID and secret with the matching pair from your Google Cloud web application.' };
  return { state: 'unavailable', detail: 'Google credential validation could not finish. No settings have been changed.' };
}