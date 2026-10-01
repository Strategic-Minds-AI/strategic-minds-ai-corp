import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { X } from 'lucide-react';

export default function BlogPostEditor({ post, onClose, onSaved }) {
  const [form, setForm] = useState({
    title: '', slug: '', excerpt: '', content_markdown: '', publish_date: '', categories: '', image_url: '', display_order: 0,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (post) {
      const pd = post.publish_date ? new Date(post.publish_date).toISOString().slice(0, 16) : '';
      setForm({
        title: post.title || '', slug: post.slug || '', excerpt: post.excerpt || '',
        content_markdown: post.content_markdown || '', publish_date: pd,
        categories: post.categories || '', image_url: post.image_url || '',
        display_order: post.display_order || 0,
      });
    } else {
      const now = new Date(); now.setDate(now.getDate() + 1);
      setForm(f => ({ ...f, publish_date: now.toISOString().slice(0, 16) }));
    }
  }, [post]);

  const slugify = s => s.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-');

  const save = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.content_markdown.trim()) { setError('Title and content are required.'); return; }
    setSaving(true); setError('');
    const payload = {
      ...form,
      slug: form.slug || slugify(form.title),
      publish_date: form.publish_date ? new Date(form.publish_date).toISOString() : new Date().toISOString(),
      display_order: Number(form.display_order) || 0,
    };
    try {
      if (post) await base44.entities.Post.update(post.id, payload);
      else await base44.entities.Post.create(payload);
      onSaved?.();
      onClose?.();
    } catch (e) { setError(e.message || 'Could not save post.'); }
    finally { setSaving(false); }
  };

  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 p-4" role="dialog" aria-modal="true">
    <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg border border-border bg-background p-6">
      <div className="mb-4 flex items-center justify-between"><h2 className="text-lg">{post ? 'Edit post' : 'New scheduled post'}</h2><button type="button" onClick={onClose} className="rounded p-1 hover:bg-muted"><X size={18}/></button></div>
      <form onSubmit={save} className="space-y-4">
        <label className="block text-sm">Title<input className="agency-input" required value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value, slug: f.slug || slugify(e.target.value) }))} /></label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm">Slug<input className="agency-input" value={form.slug} onChange={e => setForm(f => ({ ...f, slug: e.target.value }))} placeholder="auto-generated" /></label>
          <label className="block text-sm">Publish date<input type="datetime-local" className="agency-input" required value={form.publish_date} onChange={e => setForm(f => ({ ...f, publish_date: e.target.value }))} /></label>
        </div>
        <label className="block text-sm">Excerpt<input className="agency-input" value={form.excerpt} onChange={e => setForm(f => ({ ...f, excerpt: e.target.value }))} placeholder="Short summary" /></label>
        <label className="block text-sm">Categories (comma-separated)<input className="agency-input" value={form.categories} onChange={e => setForm(f => ({ ...f, categories: e.target.value }))} placeholder="AI, SEO, Strategy" /></label>
        <label className="block text-sm">Featured image URL<input className="agency-input" value={form.image_url} onChange={e => setForm(f => ({ ...f, image_url: e.target.value }))} placeholder="https://..." /></label>
        <label className="block text-sm">Content (Markdown)<textarea className="agency-input min-h-[200px] font-mono text-xs" required value={form.content_markdown} onChange={e => setForm(f => ({ ...f, content_markdown: e.target.value }))} placeholder="Write your post content in Markdown..." /></label>
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        <div className="flex gap-3"><button className="agency-button" type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save post'}</button><button type="button" onClick={onClose} className="text-sm underline">Cancel</button></div>
        <p className="text-xs text-muted-foreground">Posts appear on the blog automatically once their publish date passes. Set a future date to schedule.</p>
      </form>
    </div>
  </div>;
}