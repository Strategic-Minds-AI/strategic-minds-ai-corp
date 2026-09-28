import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';

const blank = { title: '', description: '', kind: 'one_time', price: '', interval: 'month' };
export default function AdminCatalog() {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(blank);
  const [editing, setEditing] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const load = () => base44.entities.CatalogItem.list('-created_date', 100).then(setItems).catch(e => setError(e.message));
  useEffect(() => { load(); }, []);
  const save = async e => {
    e.preventDefault(); setPending(true); setError('');
    try {
      const cents = form.kind === 'quote' ? 0 : Math.round(Number(form.price) * 100);
      if (form.kind !== 'quote' && (!Number.isSafeInteger(cents) || cents < 50 || cents > 99999999)) throw new Error('Enter a price of at least $0.50.');
      const data = { title: form.title.trim(), description: form.description.trim(), kind: form.kind, price_cents: cents, interval: form.kind === 'subscription' ? form.interval : 'month', currency: 'usd', active: true };
      if (editing) await base44.entities.CatalogItem.update(editing, data); else await base44.entities.CatalogItem.create(data);
      setForm(blank); setEditing(''); await load();
    } catch (e) { setError(e.message || 'Could not save offering.'); } finally { setPending(false); }
  };
  const archive = async item => { setPending(true); setError(''); try { await base44.entities.CatalogItem.update(item.id, { active: !item.active }); await load(); } catch (e) { setError(e.message); } finally { setPending(false); } };
  return <section className="mb-8 rounded border border-border bg-card p-6"><h2 className="mb-2 text-xl">Catalog</h2><p className="mb-4 text-sm">Publish one-time services, subscriptions or custom quotes. Prices are in USD.</p>
    <form onSubmit={save} className="grid gap-3 md:grid-cols-2"><label className="text-sm">Offering name<input className="agency-input" value={form.title} onChange={e => setForm({...form,title:e.target.value})} required maxLength={120} /></label><label className="text-sm">Type<select className="agency-input" value={form.kind} onChange={e => setForm({...form,kind:e.target.value})}><option value="one_time">One-time</option><option value="subscription">Subscription</option><option value="quote">Request a quote</option></select></label><label className="text-sm md:col-span-2">Description<textarea className="agency-input" value={form.description} onChange={e => setForm({...form,description:e.target.value})} maxLength={1000} rows={2} /></label>{form.kind !== 'quote' && <label className="text-sm">Price (USD)<input className="agency-input" type="number" step="0.01" min="0.50" required value={form.price} onChange={e => setForm({...form,price:e.target.value})} /></label>}{form.kind === 'subscription' && <label className="text-sm">Billing interval<select className="agency-input" value={form.interval} onChange={e => setForm({...form,interval:e.target.value})}><option value="month">Monthly</option><option value="year">Yearly</option></select></label>}<div className="flex items-end gap-3"><button className="agency-button" disabled={pending}>{pending ? 'Saving…' : editing ? 'Save changes' : 'Add offering'}</button>{editing && <button type="button" className="text-sm underline" onClick={() => {setForm(blank);setEditing('');}}>Cancel edit</button>}</div></form>
    {error && <p role="alert" className="mt-3 text-destructive">{error}</p>}<ul className="mt-6 divide-y divide-border">{items.map(item => <li key={item.id} className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm"><span><strong>{item.title}</strong> · {item.kind.replace('_',' ')} · {item.active ? 'Published' : 'Hidden'}</span><span className="flex gap-3"><button type="button" className="text-primary underline" onClick={() => {setEditing(item.id);setForm({title:item.title,description:item.description || '',kind:item.kind,price:(item.price_cents / 100).toFixed(2),interval:item.interval || 'month'});}}>Edit</button><button type="button" className="text-primary underline" disabled={pending} onClick={() => archive(item)}>{item.active ? 'Hide' : 'Publish'}</button></span></li>)}</ul>
  </section>;
}