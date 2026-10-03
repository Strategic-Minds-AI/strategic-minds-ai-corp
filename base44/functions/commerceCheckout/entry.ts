import { createClientFromRequest } from '../../shared/ownedClient.ts';
import { secrets } from '../../shared/runtimeSecrets.ts';

export default async function(req) {
  try {
    if (req.method !== 'POST') return Response.json({ error: 'Method not allowed' }, { status: 405 });
    const base44 = createClientFromRequest(req);
    const { itemId, name, email, returnUrl, clientId } = await req.json();
    const item = typeof itemId === 'string' ? await base44.entities.CatalogItem.get(itemId) : null;
    const buyerName = typeof name === 'string' ? name.trim() : '';
    const buyerEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
    if (!item?.active || !['one_time', 'subscription'].includes(item.kind) || !Number.isSafeInteger(item.price_cents) || item.price_cents < 50 || item.price_cents > 99999999 || !/^[a-z]{3}$/.test(item.currency || '') || (item.kind === 'subscription' && !['month','year'].includes(item.interval)) || buyerName.length < 2 || buyerName.length > 120 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(buyerEmail) || buyerEmail.length > 254) return Response.json({ error: 'Check the item and your contact details.' }, { status: 400 });
    let origin;
    try { const url = new URL(returnUrl); const allowed = process.env.APP_URL ? [new URL(process.env.APP_URL).origin] : [new URL(req.url).origin]; if (url.protocol !== 'https:' || !allowed.includes(url.origin)) throw Error(); origin = url.origin; } catch { return Response.json({ error: 'Invalid return address.' }, { status: 400 }); }
    const order = await base44.asServiceRole.entities.CommerceOrder.create({ catalog_item_id: item.id, item_title: item.title, customer_name: buyerName, customer_email: buyerEmail, status: 'pending_payment', amount_cents: item.price_cents, currency: item.currency, ...(typeof clientId === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(clientId) ? { client_id: clientId } : {}) });
    const params = new URLSearchParams({ mode: item.kind === 'subscription' ? 'subscription' : 'payment', customer_email: buyerEmail, 'line_items[0][quantity]': '1', 'line_items[0][price_data][currency]': item.currency, 'line_items[0][price_data][unit_amount]': String(item.price_cents), 'line_items[0][price_data][product_data][name]': item.title, 'metadata[base44_app_id]': secrets.get('BASE44_APP_ID'), 'metadata[order_id]': order.id, success_url: `${origin}/pricing?checkout=success&session_id={CHECKOUT_SESSION_ID}`, cancel_url: `${origin}/pricing?checkout=cancelled` });
    if (item.kind === 'subscription') { params.set('line_items[0][price_data][recurring][interval]', item.interval); params.set('subscription_data[metadata][base44_app_id]', secrets.get('BASE44_APP_ID')); params.set('subscription_data[metadata][order_id]', order.id); }
    const result = await fetch('https://api.stripe.com/v1/checkout/sessions', { method: 'POST', headers: { Authorization: `Bearer ${secrets.get('STRIPE_SECRET_KEY')}`, 'Stripe-Version': '2025-10-29.clover', 'Content-Type': 'application/x-www-form-urlencoded', 'Idempotency-Key': crypto.randomUUID() }, body: params });
    const session = await result.json();
    if (!result.ok) { console.error('Stripe checkout creation failed:', session.error?.message || result.status); return Response.json({ error: session.error?.message || 'Checkout is unavailable.' }, { status: 502 }); }
    await base44.asServiceRole.entities.CommerceOrder.update(order.id, { checkout_session_id: session.id });
    return Response.json({ url: session.url });
  } catch (error) { console.error('Commerce checkout failed:', error.message); return Response.json({ error: 'Could not start checkout.' }, { status: 500 }); }
}