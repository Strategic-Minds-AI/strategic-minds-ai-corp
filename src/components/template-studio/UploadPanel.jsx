import { useState } from 'react';
import { Upload, Loader2, X, FileCode } from 'lucide-react';
import { TEMPLATE_GALLERIES } from '@/lib/templateGalleries';
import { base44 } from '@/api/base44Client';

export default function UploadPanel({ galleryId, onClose, onUploaded }) {
  const gallery = TEMPLATE_GALLERIES.find(g => g.id === galleryId);
  const [form, setForm] = useState({
    title: '',
    category: '',
    city: '',
    description: '',
    html_content: '',
    css_content: '',
    design_style: '',
    auto_score: true,
  });
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [pasteMode, setPasteMode] = useState(true);
  const [file, setFile] = useState(null);

  const submit = async () => {
    if (!form.title.trim() || !form.html_content.trim()) return;
    setUploading(true);
    setError(null);
    try {
      const res = await base44.functions.invoke('templateStudio', {
        action: 'upload',
        gallery_id: galleryId,
        ...form,
        tags: form.category ? [form.category, form.city].filter(Boolean) : [],
      });
      if (res.data?.error) throw new Error(res.data.error);
      onUploaded();
      onClose();
    } catch (e) {
      setError(e.message);
    }
    setUploading(false);
  };

  const handleFile = async (f) => {
    setFile(f);
    const text = await f.text();
    setForm(prev => ({ ...prev, html_content: text }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 p-4">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-border bg-card p-6 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-foreground">Upload to {gallery?.name}</h2>
            <p className="text-xs text-muted-foreground">{gallery?.style}</p>
          </div>
          <button onClick={onClose} className="rounded-lg p-2 hover:bg-muted"><X size={18} /></button>
        </div>

        {error && <div className="mb-3 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">{error}</div>}

        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <input className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground" placeholder="Template title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
            <input className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground" placeholder="Category (e.g. hvac)" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} />
            <input className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground" placeholder="City (optional)" value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} />
            <input className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground" placeholder="Design style" value={form.design_style} onChange={e => setForm({ ...form, design_style: e.target.value })} />
          </div>
          <textarea className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground" placeholder="Description" rows={2} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />

          {/* Upload mode toggle */}
          <div className="flex gap-2">
            <button onClick={() => setPasteMode(true)} className={`rounded-lg px-3 py-1.5 text-xs font-medium ${pasteMode ? 'bg-primary text-primary-foreground' : 'border border-border text-foreground'}`}>Paste HTML</button>
            <button onClick={() => setPasteMode(false)} className={`rounded-lg px-3 py-1.5 text-xs font-medium ${!pasteMode ? 'bg-primary text-primary-foreground' : 'border border-border text-foreground'}`}>Upload .html file</button>
          </div>

          {pasteMode ? (
            <textarea className="w-full rounded-lg border border-border bg-background px-3 py-2 font-mono text-xs text-foreground" placeholder="Paste full HTML content here..." rows={8} value={form.html_content} onChange={e => setForm({ ...form, html_content: e.target.value })} />
          ) : (
            <label className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-border py-8 hover:border-primary">
              <FileCode size={32} className="mb-2 text-muted-foreground" />
              <span className="text-sm text-foreground">{file ? file.name : 'Click to select .html file'}</span>
              <input type="file" accept=".html,.htm" className="hidden" onChange={e => e.target.files[0] && handleFile(e.target.files[0])} />
            </label>
          )}

          <textarea className="w-full rounded-lg border border-border bg-background px-3 py-2 font-mono text-xs text-foreground" placeholder="CSS content (optional)" rows={3} value={form.css_content} onChange={e => setForm({ ...form, css_content: e.target.value })} />

          <label className="flex items-center gap-2 text-sm text-foreground">
            <input type="checkbox" checked={form.auto_score} onChange={e => setForm({ ...form, auto_score: e.target.checked })} />
            Auto-score with AI Gateway
          </label>

          <button onClick={submit} disabled={uploading || !form.title.trim() || !form.html_content.trim()} className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-40">
            {uploading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />} Upload Template
          </button>
        </div>
      </div>
    </div>
  );
}