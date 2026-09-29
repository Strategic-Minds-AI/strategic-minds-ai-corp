import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import CommercePurchase from '@/components/commerce/CommercePurchase';

export default function CommerceCatalog() {
  const [items, setItems] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  useEffect(() => { base44.entities.CatalogItem.list('-created_date', 100).then(data => setItems(data.filter(x => x.active))).catch(e => setError(e.message || 'Catalog unavailable.')).finally(() => setLoading(false)); }, []);
  const checkout = new URLSearchParams(window.location.search).get('checkout');
  if (!loading && !error && !items.length && !checkout) return null;
  return <section className="agency-container py-16" aria-label="Services catalog">
    {checkout === 'success' && <p role="status" className="mb-6 rounded border border-primary bg-muted p-4 text-sm">Thank you. Your payment is being confirmed; our team will review your order before work begins.</p>}
    {checkout === 'cancelled' && <p role="status" className="mb-6 rounded border border-border p-4 text-sm">Checkout was cancelled. Nothing has been charged.</p>}
    {loading ? <p role="status">Loading offerings…</p> : error ? <p role="alert" className="text-destructive">{error}</p> : !items.length ? <p>Our offerings are being prepared. Please contact us for a quote.</p> : <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">{items.map(item => <article key={item.id} className="rounded border border-border bg-card p-6"><h2 className="text-xl">{item.title}</h2><p className="mb-6 whitespace-pre-wrap text-sm">{item.description}</p><p className="mb-5 font-bold text-foreground">{item.kind === 'quote' ? 'Custom quote' : `${new Intl.NumberFormat('en-US', {style:'currency', currency:item.currency || 'USD'}).format(item.price_cents / 100)}${item.kind === 'subscription' ? ` / ${item.interval}` : ''}`}</p><button type="button" className="agency-button" onClick={() => setSelected(item)}>{item.kind === 'quote' ? 'Request a quote' : 'Continue to checkout'}</button></article>)}</div>}
    {selected && <CommercePurchase key={selected.id} item={selected} onClose={() => setSelected(null)} />}
  </section>;
}