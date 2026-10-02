export default function authErrorMessage(error) {
  let message = typeof error === 'string' ? error : error?.message || 'Sign-in could not finish. Please try again.';
  for (let pass = 0; pass < 2; pass++) { try { const decoded = decodeURIComponent(message); if (decoded === message) break; message = decoded; } catch { break; } }
  if (/unable to exchange external code|invalid_client|oauth_callback_error/i.test(message)) return 'Google could not complete sign-in. You can create an account or sign in using email and password instead.';
  if (error?.code === 'email_address_not_authorized') return 'The verification email could not be sent to this address. The site administrator needs to finish email delivery setup.';
  if (error?.code === 'over_email_send_rate_limit') return 'Too many verification emails were requested. Please wait before trying again.';
  return message;
}