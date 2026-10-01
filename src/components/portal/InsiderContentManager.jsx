import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, X, Loader2, Star } from 'lucide-react';
import { base44 } from '@/api/base44Client';

const CATEGORIES = [
  { value: 'tip', label: 'Quick Tip' },
  { value: 'trick', label: 'Insider Trick' },
  { value: 'wealth', label: 'Wealth Builder' },
  { value: 'secret', label: 'Insider Secret' },
];

export default function InsiderContentManager() {
  const [items, setItems] = useState(null);
  const [editing, setEditing] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const load = () => {
    base44.entities.InsiderContent.filter({}, { sort: '-publish_date', limit: 200 })
      .then(({ items }) => setItems(items))
      .catch(() => setItems([]));
  };

  useEffect(load, []);

  const handleSave = async (data) => {
    if (editing) {
      await base44.entities.InsiderContent.update(editing.id, data);
    } else {
      await base44.entities.InsiderContent.create({ ...data, publish_date: data.publish_date || new Date().toISOString() });
    }
    setShowForm(false);
    setEditing(null);
    load();
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this content? This cannot be undone.')) return;
    await base44.entities.InsiderContent.delete(id);
    load();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground">Insider Content</h2>
          <p className="text-sm text-muted-foreground">Manage tips, tricks, wealth builders, and secrets in the insider app.</p>
        </div>
        <button onClick={() => { setEditing(null); setShowForm(true); }} className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
          <Plus size={16} /> New content
        </button>
      </div>
      {!items ? (
        <div className="flex justify-center py-12"><Loader2 className="animate-spin text-blue-500" size={24} /></div>
      ) : items.length === 0 ? (
        <p className="rounded-lg border border-border bg-card p-8 text-center text-sm text-muted-foreground">No content yet. Click "New content" to add your first insider tip.</p>
      ) : (
        <div className="space-y-2">
          {items.map(item => (
            <div key={item.id} className="flex items-start gap-3 rounded-lg border border-border bg-card p-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">{CATEGORIES.find(c => c.value === item.category)?.label || item.category}</span>
                  {item.featured && <Star size={12} className="fill-amber-400 text-amber-400" />}
                </div>
                <p className="mt-1 text-sm font-semibold text-foreground">{item.title}</p>
                <p className="line-clamp-1 text-xs text-muted-foreground">{item.excerpt}</p>
              </div>
              <button onClick={() => { setEditing(item); setShowForm(true); }} className="rounded p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"><Pencil size={15} /></button>
              <button onClick={() => handleDelete(item.id)} className="rounded p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"><Trash2 size={15} /></button>
            </div>
          ))}
        </div>
      )}
      {showForm && <ContentForm initial={editing} onSave={handleSave} onCancel={() => { setShowForm(false); setEditing(null); }} />}
    </div>
  );
}

function ContentForm({ initial, onSave, onCancel }) {
  const [form, setForm] = useState({
    title: initial?.title || '',
    slug: initial?.slug || '',
    category: initial?.category || 'tip',
    excerpt: initial?.excerpt || '',
    content_markdown: initial?.content_markdown || '',
    image_url: initial?.image_url || '',
    read_time_minutes: initial?.read_time_minutes || 3,
    featured: initial?.featured || false,
    publish_date: initial?.publish_date || '',
  });
  const [saving, setSaving] = useState(false);

  const slugify = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    const data = { ...form, slug: form.slug || slugify(form.title), read_time_minutes: Number(form.read_time_minutes) || 3 };
    if (!data.publish_date) delete data.publish_date;
    try { await onSave(data); } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/30 p-4">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-lg border border-border bg-background p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-bold text-foreground">{initial ? 'Edit content' : 'New insider content'}</h3>
          <button onClick={onCancel} aria-label="Close"><X size={20} /></button>
        </div>
        <form onSubmit={submit} className="space-y-3">
          <Field label="Title"><input className="agency-input" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required maxLength={200} /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Category"><select className="agency-input" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>{CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}</select></Field>
            <Field label="Read time (min)"><input type="number" className="agency-input" value={form.read_time_minutes} onChange={e => setForm({ ...form, read_time_minutes: e.target.value })} min="1" max="60" /></Field>
          </div>
          <Field label="Slug (optional — auto-generated from title)"><input className="agency-input" value={form.slug} onChange={e => setForm({ ...form, slug: e.target.value })} placeholder="auto-generated" /></Field>
          <Field label="Excerpt"><textarea className="agency-input min-h-16 resize-y" value={form.excerpt} onChange={e => setForm({ ...form, excerpt: e.target.value })} required maxLength={300} /></Field>
          <Field label="Content (Markdown)"><textarea className="agency-input min-h-48 resize-y font-mono text-xs" value={form.content_markdown} onChange={e => setForm({ ...form, content_markdown: e.target.value })} required /></Field>
          <Field label="Image URL (optional)"><input className="agency-input" value={form.image_url} onChange={e => setForm({ ...form, image_url: e.target.value })} /></Field>
          <label className="flex items-center gap-2 text-sm text-foreground"><input type="checkbox" checked={form.featured} onChange={e => setForm({ ...form, featured: e.target.checked })} /> Featured (shows at top of feed)</label>
          <Field label="Publish date (optional — defaults to now)"><input type="datetime-local" className="agency-input" value={form.publish_date ? form.publish_date.slice(0, 16) : ''} onChange={e => setForm({ ...form, publish_date: e.target.value ? new Date(e.target.value).toISOString() : '' })} /></Field>
          <div className="flex gap-2 pt-2">
            <button type="submit" disabled={saving} className="flex-1 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">{saving ? 'Saving…' : 'Save content'}</button>
            <button type="button" onClick={onCancel} className="rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-foreground hover:bg-muted">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return <div><label className="text-xs font-medium text-foreground">{label}</label>{children}</div>;
}