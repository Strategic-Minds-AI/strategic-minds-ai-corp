import { useState, useEffect } from 'react';
import { X, Code, Eye, Copy, Check } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function TemplatePreview({ templateId, onClose }) {
  const [template, setTemplate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('preview');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!templateId) return;
    (async () => {
      try {
        const res = await base44.functions.invoke('templateStudio', { action: 'getTemplate', template_id: templateId });
        setTemplate(res.data?.template);
      } catch {}
      setLoading(false);
    })();
  }, [templateId]);

  const copyHtml = () => {
    navigator.clipboard.writeText(template?.html_content || '');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) return <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40"><div className="text-foreground">Loading...</div></div>;
  if (!template) return null;

  const fullDoc = `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${template.title}</title><style>${template.css_content || ''}</style></head><body>${template.html_content || ''}<script>${template.js_content || ''}</script></body></html>`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 p-4">
      <div className="flex h-[90vh] w-full max-w-4xl flex-col rounded-xl border border-border bg-card shadow-2xl">
        <div className="flex items-center justify-between border-b border-border px-5 py-3">
          <div>
            <h2 className="text-base font-bold text-foreground">{template.title}</h2>
            <p className="text-xs text-muted-foreground">{template.gallery_name} · {template.category} · {template.quality_score}/100</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={copyHtml} className="flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-xs text-foreground hover:bg-muted">
              {copied ? <Check size={12} className="text-green-600" /> : <Copy size={12} />} Copy HTML
            </button>
            <button onClick={onClose} className="rounded-lg p-2 hover:bg-muted"><X size={18} /></button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-border px-5 py-2">
          <button onClick={() => setTab('preview')} className={`flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium ${tab === 'preview' ? 'bg-primary text-primary-foreground' : 'text-foreground hover:bg-muted'}`}><Eye size={12} /> Preview</button>
          <button onClick={() => setTab('html')} className={`flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium ${tab === 'html' ? 'bg-primary text-primary-foreground' : 'text-foreground hover:bg-muted'}`}><Code size={12} /> HTML</button>
          <button onClick={() => setTab('css')} className={`flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium ${tab === 'css' ? 'bg-primary text-primary-foreground' : 'text-foreground hover:bg-muted'}`}><Code size={12} /> CSS</button>
        </div>

        {/* Content */}
        <div className="min-h-0 flex-1 overflow-auto">
          {tab === 'preview' && (
            <iframe srcDoc={fullDoc} className="h-full w-full border-0" title={template.title} sandbox="allow-scripts" />
          )}
          {tab === 'html' && (
            <pre className="overflow-auto p-4 text-xs text-foreground"><code>{template.html_content}</code></pre>
          )}
          {tab === 'css' && (
            <pre className="overflow-auto p-4 text-xs text-foreground"><code>{template.css_content || 'No CSS content'}</code></pre>
          )}
        </div>
      </div>
    </div>
  );
}