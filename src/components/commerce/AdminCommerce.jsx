import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import AdminCatalog from '@/components/commerce/AdminCatalog';

export default function AdminCommerce({ clients, onDone }) {
  const [orders, setOrders] = useState([]);
  const [quotes, setQuotes] = useState([]);
  const [selected, setSelected] = useState({});
  const [pending, setPending] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const load = async () => { try { const [o,q] = await Promise.all([base44.entities.CommerceOrder.list('-created_date', 100),base44.entities.CatalogQuote.list('-created_date',100)]); setOrders(o);setQuotes(q);setError(''); } catch(e) {setError(e.message || 'Could not load sales.');} finally {setLoading(false);} };
  useEffect(() => {load();}, []);
  const approve = async order => { setPending(order.id);setError('');try { await base44.functions.invoke('commerceApprove', {orderId:order.id,clientId:selected[order.id]});await load();await onDone(); } catch(e) {setError(e.response?.data?.error || e.message || 'Could not approve order.');}finally {setPending('');} };
  const reviewed = async quote => { setPending(quote.id);try {await base44.entities.CatalogQuote.update(quote.id,{status:'reviewed'});await load();}catch(e){setError(e.message);}finally{setPending('');} };
  return <><AdminCatalog /><section className="mb-8 rounded border border-border bg-card p-6"><h2 className="mb-2 text-xl">Orders awaiting approval</h2><p className="mb-5 text-sm">Only confirmed payments can be approved. Invite the buyer as a client using the same email, then assign their order.</p>
    {loading ? <p role="status">Loading orders…</p> : !orders.length ? <p className="text-sm">No orders yet.</p> : <ul className="divide-y divide-border">{orders.map(o => <li key={o.id} className="space-y-2 py-4 text-sm"><p><strong>{o.item_title}</strong> · {o.customer_name} ({o.customer_email}) · {o.status.replaceAll('_',' ')}</p>{o.status === 'paid_awaiting_approval' && <div className="flex flex-wrap gap-3"><select aria-label={`Client for ${o.item_title}`} className="agency-input !mt-0 max-w-xs" value={selected[o.id] || ''} onChange={e => setSelected({...selected,[o.id]:e.target.value})}><option value="">Matching registered client</option>{clients.filter(c => c.email?.toLowerCase() === o.customer_email).map(c => <option key={c.id} value={c.id}>{c.email}</option>)}</select><button type="button" className="agency-button" disabled={!selected[o.id] || pending === o.id} onClick={() => approve(o)}>{pending === o.id ? 'Approving…' : 'Approve & create project'}</button></div>}</li>)}</ul>}{error && <p role="alert" className="mt-4 text-destructive">{error}</p>}
  </section><section className="mb-8 rounded border border-border bg-card p-6"><h2 className="mb-4 text-xl">Quote requests</h2>{loading ? <p role="status">Loading requests…</p> : !quotes.length ? <p className="text-sm">No requests yet.</p> : <ul className="divide-y divide-border">{quotes.map(q => <li key={q.id} className="py-4 text-sm"><p><strong>{q.item_title}</strong> · {q.name} · <a className="text-primary underline" href={`mailto:${q.email}`}>{q.email}</a> · {q.status}</p><p className="mt-2 whitespace-pre-wrap">{q.message}</p>{q.status === 'new' && <button type="button" className="mt-2 text-primary underline" disabled={pending === q.id} onClick={() => reviewed(q)}>Mark reviewed</button>}</li>)}</ul>}</section></>;
}