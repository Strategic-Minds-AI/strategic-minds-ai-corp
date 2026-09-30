import { useEffect, useMemo, useState } from 'react';
import { base44 } from '@/api/base44Client';
import CommercePurchase from '@/components/commerce/CommercePurchase';
import { Search, Sparkles, Repeat, FileText } from 'lucide-react';

const CATEGORY_LABELS = {
  strategy: 'AI Strategy',
  automation: 'Automation & Agents',
  knowledge: 'Chatbots & Knowledge',
  data: 'Data Intelligence',
  marketing: 'AI Marketing',
  search: 'Search Visibility',
  crm: 'CRM & Revenue',
  websites: 'Websites',
  software: 'Custom AI Apps',
  training: 'Training',
  governance: 'Governance',
  managed: 'Managed AI',
};

const KIND_BADGE = {
  one_time: { label: 'One-time', icon: FileText },
  subscription: { label: 'Subscription', icon: Repeat },
  quote: { label: 'Custom quote', icon: Sparkles },
};

function formatPrice(item) {
  if (item.kind === 'quote') return 'Custom quote';
  const amount = new Intl.NumberFormat('en-US', { style: 'currency', currency: item.currency || 'USD' }).format(item.price_cents / 100);
  return item.kind === 'subscription' ? `${amount} / ${item.interval}` : amount;
}

export default function CommerceCatalog() {
  const [items, setItems] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [query, setQuery] = useState('');

  useEffect(() => {
    base44.entities.CatalogItem.list('-created_date', 100)
      .then(data => setItems(data.filter(x => x.active)))
      .catch(e => setError(e.message || 'Catalog unavailable.'))
      .finally(() => setLoading(false));
  }, []);

  const checkout = new URLSearchParams(window.location.search).get('checkout');
  const categories = useMemo(() => {
    const present = new Set(items.map(i => i.category).filter(Boolean));
    return Object.entries(CATEGORY_LABELS).filter(([id]) => present.has(id));
  }, [items]);

  const filtered = useMemo(() => {
    let result = items;
    if (activeCategory !== 'all') result = result.filter(i => i.category === activeCategory);
    if (query.trim()) {
      const q = query.toLowerCase();
      result = result.filter(i => i.title.toLowerCase().includes(q) || (i.description || '').toLowerCase().includes(q));
    }
    return result;
  }, [items, activeCategory, query]);

  if (!loading && !error && !items.length && !checkout) return null;

  return (
    <section className="agency-container py-16" aria-label="Services catalog">
      <div className="mb-8">
        <p className="agency-eyebrow mb-2">PAYMENT READY</p>
        <h2 className="agency-heading mb-3">Pay securely for any service.</h2>
        <p className="max-w-2xl text-sm leading-relaxed">Every offering below is ready for instant checkout. Pay with any major credit card through Stripe — your project begins the moment payment is confirmed.</p>
      </div>

      {checkout === 'success' && <p role="status" className="mb-6 rounded border border-primary bg-muted p-4 text-sm">Thank you. Your payment is being confirmed; our team will review your order before work begins.</p>}
      {checkout === 'cancelled' && <p role="status" className="mb-6 rounded border border-border p-4 text-sm">Checkout was cancelled. Nothing has been charged.</p>}

      {loading ? (
        <p role="status">Loading offerings…</p>
      ) : error ? (
        <p role="alert" className="text-destructive">{error}</p>
      ) : !items.length ? (
        <p>Our offerings are being prepared. Please contact us for a quote.</p>
      ) : (
        <>
          <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => setActiveCategory('all')} className={`rounded-full border px-4 py-1.5 text-xs font-medium transition ${activeCategory === 'all' ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-card hover:border-primary'}`}>All services</button>
              {categories.map(([id, label]) => (
                <button key={id} type="button" onClick={() => setActiveCategory(id)} className={`rounded-full border px-4 py-1.5 text-xs font-medium transition ${activeCategory === id ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-card hover:border-primary'}`}>{label}</button>
              ))}
            </div>
            <label className="relative block max-w-xs">
              <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input type="search" value={query} onChange={e => setQuery(e.target.value)} placeholder="Search services…" className="w-full rounded-sm border border-border bg-card py-2 pl-9 pr-3 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" />
            </label>
          </div>

          {filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground">No services match your search. Try a different category or term.</p>
          ) : (
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {filtered.map(item => {
                const badge = KIND_BADGE[item.kind] || KIND_BADGE.quote;
                const Icon = badge.icon;
                return (
                  <article key={item.id} className="flex flex-col rounded border border-border bg-card p-6 shadow-sm transition hover:border-primary hover:shadow-md">
                    <div className="mb-4 flex items-center justify-between">
                      <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{item.category ? CATEGORY_LABELS[item.category] : ''}</span>
                      <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-0.5 text-[10px] font-medium text-muted-foreground"><Icon size={11} /> {badge.label}</span>
                    </div>
                    <h3 className="mb-2 text-lg font-bold text-foreground">{item.title}</h3>
                    <p className="mb-5 flex-1 whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">{item.description}</p>
                    <p className="mb-4 text-xl font-bold text-primary">{formatPrice(item)}</p>
                    <button type="button" className="agency-button mt-auto" onClick={() => setSelected(item)}>{item.kind === 'quote' ? 'Request a quote' : 'Pay securely'}</button>
                  </article>
                );
              })}
            </div>
          )}
        </>
      )}

      {selected && <CommercePurchase key={selected.id} item={selected} onClose={() => setSelected(null)} />}
    </section>
  );
}