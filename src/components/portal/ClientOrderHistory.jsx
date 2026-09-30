import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';

const STATUS_LABELS = {
  pending_payment: { label: 'Payment pending', color: 'text-muted-foreground' },
  paid_awaiting_approval: { label: 'Paid — under review', color: 'text-primary' },
  approved: { label: 'Approved', color: 'text-green' },
  expired: { label: 'Expired', color: 'text-destructive' },
};

function formatAmount(cents, currency) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: currency || 'USD' }).format((cents || 0) / 100);
}

export default function ClientOrderHistory() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const load = async () => {
    setLoading(true);
    try {
      const data = await base44.entities.CommerceOrder.list('-created_date', 50);
      setOrders(data);
      setError('');
    } catch (e) { setError(e.message || 'Could not load your orders.'); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);
  return <section aria-label="Your orders" className="mb-8 rounded border border-border bg-card p-6">
    <h2 className="mb-2 text-xl">Your Orders</h2>
    <p className="mb-5 text-sm text-muted-foreground">Payments you have made through the site and their current status.</p>
    {error && <p role="alert" className="text-sm text-destructive">{error} <button type="button" className="underline" onClick={load}>Try again</button></p>}
    {loading ? <p role="status" className="text-sm">Loading your orders…</p> : orders.length === 0 ? <p className="text-sm text-muted-foreground">No orders yet. When you purchase a service, it will appear here.</p> : <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b border-border text-left text-xs uppercase tracking-wider text-muted-foreground"><th className="py-2 pr-4">Service</th><th className="py-2 pr-4">Amount</th><th className="py-2 pr-4">Date</th><th className="py-2">Status</th></tr></thead><tbody>{orders.map(order => { const status = STATUS_LABELS[order.status] || { label: order.status, color: 'text-muted-foreground' }; return <tr key={order.id} className="border-b border-border"><td className="py-3 pr-4 font-medium text-foreground">{order.item_title}</td><td className="py-3 pr-4">{formatAmount(order.amount_cents, order.currency)}</td><td className="py-3 pr-4 text-muted-foreground">{new Date(order.created_date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</td><td className={`py-3 ${status.color}`}>{status.label}</td></tr>; })}</tbody></table></div>}
  </section>;
}