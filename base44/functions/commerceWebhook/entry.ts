import { createClientFromRequest } from '../../shared/ownedClient.ts';
import { secrets } from '../../shared/runtimeSecrets.ts';
import Stripe from 'npm:stripe@17.7.0';

export default async function(req) {
  try {
    if (req.method !== 'POST') return Response.json({ error: 'Method not allowed' }, { status: 405 });
    const signature = req.headers.get('stripe-signature');
    if (!signature) return Response.json({ error: 'Missing signature' }, { status: 400 });
    const stripe = new Stripe(secrets.get('STRIPE_SECRET_KEY'));
    const event = await stripe.webhooks.constructEventAsync(await req.text(), signature, secrets.get('STRIPE_WEBHOOK_SECRET'));
    if (!['checkout.session.completed','checkout.session.async_payment_succeeded','checkout.session.expired'].includes(event.type)) return Response.json({ received: true });
    const session = event.data.object;
    const orderId = session.metadata?.order_id;
    if (!orderId || session.metadata?.base44_app_id !== secrets.get('BASE44_APP_ID')) return Response.json({ error: 'Unknown order' }, { status: 400 });
    const base44 = createClientFromRequest(req);
    const order = await base44.asServiceRole.entities.CommerceOrder.get(orderId);
    if (!order || (order.checkout_session_id && order.checkout_session_id !== session.id)) return Response.json({ error: 'Order mismatch' }, { status: 400 });
    if (event.type === 'checkout.session.expired') {
      if (order.status === 'pending_payment') await base44.asServiceRole.entities.CommerceOrder.update(order.id, { status: 'expired' });
    } else if (session.payment_status === 'paid' && ['pending_payment','expired'].includes(order.status) && session.amount_total === order.amount_cents && session.currency === order.currency && session.customer_email?.toLowerCase() === order.customer_email) {
      await base44.asServiceRole.entities.CommerceOrder.update(order.id, { status: 'paid_awaiting_approval', checkout_session_id: session.id, stripe_subscription_id: typeof session.subscription === 'string' ? session.subscription : '' });
    }
    return Response.json({ received: true });
  } catch (error) { console.error('Commerce webhook failed:', error.message); return Response.json({ error: 'Could not process event' }, { status: 400 }); }
}