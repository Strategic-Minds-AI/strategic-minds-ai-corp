import { useState } from 'react';
import { base44 } from '@/api/base44Client';

export default function CommercePurchase({ item, onClose }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [pending, setPending] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const quote = item.kind === 'quote';
  const submit = async event => {
    event.preventDefault(); setPending(true); setError('');
    if (quote) {
      try { await base44.functions.invoke('commerceQuote', { itemId: item.id, name, email, message }); setSuccess(true); }
      catch (e) { setError(e.response?.data?.error || e.message || 'Could not send your request.'); }
      finally { setPending(false); }
      return;
    }
    const isFramed = window.self !== window.top;
    const checkoutTab = isFramed ? window.open('', '_blank') : null;
    if (isFramed && !checkoutTab) { setError('Allow popups to continue to checkout.'); setPending(false); return; }
    if (checkoutTab) checkoutTab.opener = null;
    try {
      const { data } = await base44.functions.invoke('commerceCheckout', { itemId: item.id, name, email, returnUrl: window.location.origin });
      if (!data.url) throw new Error('Checkout could not open.');
      if (checkoutTab) checkoutTab.location.replace(data.url); else window.location.assign(data.url);
    } catch (e) { checkoutTab?.close(); setError(e.response?.data?.error || e.message || 'Checkout could not open.'); setPending(false); }
  };
  return <div className="mt-8 max-w-xl rounded border border-primary bg-card p-6"><div className="flex items-start justify-between gap-4"><h2 className="text-xl">{quote ? `Request a quote: ${item.title}` : `Checkout: ${item.title}`}</h2><button type="button" onClick={onClose} className="text-sm underline">Close</button></div>
    {success ? <p role="status">Thanks — your request has been sent. We’ll be in touch.</p> : <form onSubmit={submit} className="space-y-4"><label className="block text-sm">Your name<input className="agency-input" required minLength={2} maxLength={120} value={name} onChange={e => setName(e.target.value)} disabled={pending} /></label><label className="block text-sm">Email<input type="email" className="agency-input" required maxLength={254} value={email} onChange={e => setEmail(e.target.value)} disabled={pending} /></label>{quote && <label className="block text-sm">Project details<textarea className="agency-input" required minLength={10} maxLength={3000} rows={4} value={message} onChange={e => setMessage(e.target.value)} disabled={pending} /></label>}{error && <p role="alert" className="text-sm text-destructive">{error}</p>}<button className="agency-button" disabled={pending}>{pending ? 'Please wait…' : quote ? 'Send request' : 'Pay securely'}</button></form>}
  </div>;
}