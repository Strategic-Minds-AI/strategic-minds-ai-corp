import React, { useState, useCallback, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { parseHtmlTemplate } from '@/lib/frontendFactory/templateIngestor';
import { addTemplatePatterns, loadTemplatePatterns, getTemplatePatternCount } from '@/lib/frontendFactory/runtimeRegistry';
import { Upload, FileCode, Trash2, Loader2, CheckCircle, XCircle, Eye, Tag, Palette, Type, Layout, RefreshCw, Plus, Link2, Code } from 'lucide-react';

export default function TemplateIngestion() {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [templateCount, setTemplateCount] = useState(0);

  const [form, setForm] = useState({
    name: '',
    source_type: 'html',
    content: '',
    source_url: '',
    tags: '',
  });

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await base44.functions.invoke('ingestTemplate', { action: 'list' });
      setTemplates(res.data?.templates || []);
      const count = await loadTemplatePatterns((action, payload) => base44.functions.invoke(action, payload));
      setTemplateCount(getTemplatePatternCount());
    } catch (e) {
      setError(e.message);
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const ingest = async () => {
    if (!form.name.trim() || !form.content.trim()) return;
    setUploading(true);
    setError(null);
    try {
      // Step 1: Store raw content
      const res = await base44.functions.invoke('ingestTemplate', {
        action: 'ingest',
        name: form.name,
        source_type: form.source_type,
        content: form.content,
        source_url: form.source_url,
        tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean),
      });

      const template = res.data?.template;
      if (!template) throw new Error('Failed to store template');

      // Step 2: Extract patterns client-side
      setExtracting(true);
      const extracted = parseHtmlTemplate(form.content, form.name);

      // Step 3: Save extracted patterns
      await base44.functions.invoke('ingestTemplate', {
        action: 'update',
        template_id: template.id,
        extracted_patterns: extracted,
        pattern_summary: `${extracted.summary.colors.length} colors, ${extracted.summary.fonts.length} fonts, ${extracted.summary.sections.length} sections, ${extracted.summary.componentCount} components`,
        color_palette: extracted.summary.colors,
        font_families: extracted.summary.fonts,
        section_count: extracted.summary.sections.length,
      });

      // Step 4: Activate the template
      await base44.functions.invoke('ingestTemplate', { action: 'activate', template_id: template.id });

      // Step 5: Add to runtime registry
      addTemplatePatterns(extracted);

      setSuccess(`Ingested "${form.name}" — ${extracted.summary.colors.length} colors, ${extracted.summary.componentCount} components extracted`);
      setForm({ name: '', source_type: 'html', content: '', source_url: '', tags: '' });
      setShowUpload(false);
      await load();
    } catch (e) {
      setError(e.message);
    }
    setUploading(false);
    setExtracting(false);
  };

  const remove = async (id) => {
    try {
      await base44.functions.invoke('ingestTemplate', { action: 'delete', template_id: id });
      await load();
    } catch (e) {
      setError(e.message);
    }
  };

  const viewTemplate = async (id) => {
    try {
      const res = await base44.functions.invoke('ingestTemplate', { action: 'get', template_id: id });
      setSelectedTemplate(res.data?.template);
    } catch (e) {
      setError(e.message);
    }
  };

  const fetchUrl = async () => {
    if (!form.source_url.trim()) return;
    setUploading(true);
    setError(null);
    try {
      const res = await fetch(form.source_url);
      const html = await res.text();
      setForm({ ...form, content: html, source_type: 'url' });
      setSuccess(`Fetched ${html.length} chars from ${form.source_url}`);
    } catch (e) {
      setError(`Failed to fetch URL: ${e.message}`);
    }
    setUploading(false);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground"><FileCode size={16} className="text-primary"/> Template Ingestion</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">{templates.length} templates · {templateCount} patterns in runtime registry</p>
        </div>
        <div className="flex gap-2">
          <button onClick={load} className="rounded-lg p-2 text-muted-foreground hover:bg-muted" title="Refresh"><RefreshCw size={14}/></button>
          <button onClick={() => setShowUpload(!showUpload)} className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"><Plus size={16}/> Ingest Template</button>
        </div>
      </div>

      {error && <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"><XCircle size={16}/> {error}</div>}
      {success && <div className="flex items-center gap-2 rounded-lg border border-green-500/30 bg-green-500/5 px-4 py-3 text-sm text-green-600"><CheckCircle size={16}/> {success}</div>}

      {/* Upload form */}
      {showUpload && (
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm space-y-3">
          <h3 className="text-sm font-semibold text-foreground">Ingest New Template</h3>
          <div className="grid grid-cols-2 gap-3">
            <input className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground" placeholder="Template name" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
            <input className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground" placeholder="Tags (comma-separated)" value={form.tags} onChange={e => setForm({...form, tags: e.target.value})} />
          </div>
          <div className="flex gap-2">
            <input className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground" placeholder="Or fetch from URL..." value={form.source_url} onChange={e => setForm({...form, source_url: e.target.value})} />
            <button onClick={fetchUrl} disabled={uploading || !form.source_url.trim()} className="flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm text-foreground hover:bg-muted disabled:opacity-40">
              {uploading ? <Loader2 size={14} className="animate-spin"/> : <Link2 size={14}/>} Fetch
            </button>
          </div>
          <textarea className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs font-mono text-foreground" rows={8} placeholder="Paste HTML template here..." value={form.content} onChange={e => setForm({...form, content: e.target.value, source_type: 'html'})} />
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-muted-foreground">{form.content.length} chars · will extract colors, fonts, sections, components</span>
            <button onClick={ingest} disabled={uploading || extracting || !form.name.trim() || !form.content.trim()} className="flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-40">
              {extracting ? <><Loader2 size={16} className="animate-spin"/> Extracting patterns...</> : uploading ? <><Loader2 size={16} className="animate-spin"/> Storing...</> : <><Upload size={16}/> Ingest & Extract</>}
            </button>
          </div>
        </div>
      )}

      {/* Template list */}
      {loading ? (
        <div className="flex items-center justify-center py-12"><Loader2 size={24} className="animate-spin text-muted-foreground"/></div>
      ) : templates.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-12 text-center">
          <FileCode size={32} className="mx-auto mb-3 text-muted-foreground"/>
          <p className="text-sm text-muted-foreground">No templates yet. Click "Ingest Template" to add one.</p>
          <p className="mt-2 text-xs text-muted-foreground">Any HTML template will be parsed into UFF patterns the agents can use.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {templates.map(t => (
            <div key={t.id} className="rounded-xl border border-border bg-card p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary"><Code size={18}/></div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-foreground">{t.name}</span>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${t.status === 'active' ? 'bg-green-500/10 text-green-600' : t.status === 'extracted' ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>{t.status}</span>
                    <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-bold uppercase text-muted-foreground">{t.source_type}</span>
                  </div>
                  <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Palette size={10}/> {t.pattern_count || 0} patterns</span>
                    <span className="flex items-center gap-1"><Layout size={10}/> {t.section_count || 0} sections</span>
                    {t.tags?.length > 0 && <span className="flex items-center gap-1"><Tag size={10}/> {t.tags.join(', ')}</span>}
                  </div>
                </div>
                <button onClick={() => viewTemplate(t.id)} className="rounded-lg p-2 text-muted-foreground hover:bg-muted" title="View"><Eye size={16}/></button>
                <button onClick={() => remove(t.id)} className="rounded-lg p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive" title="Delete"><Trash2 size={16}/></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Template detail modal */}
      {selectedTemplate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setSelectedTemplate(null)}>
          <div className="max-h-[80vh] w-full max-w-3xl overflow-hidden rounded-2xl border border-border bg-card shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-border p-4">
              <h3 className="text-sm font-semibold text-foreground">{selectedTemplate.name}</h3>
              <button onClick={() => setSelectedTemplate(null)} className="rounded-lg p-2 text-muted-foreground hover:bg-muted"><XCircle size={16}/></button>
            </div>
            <div className="max-h-[60vh] overflow-auto p-4 space-y-4">
              {selectedTemplate.color_palette && (
                <div>
                  <h4 className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase text-muted-foreground"><Palette size={12}/> Colors</h4>
                  <div className="flex flex-wrap gap-2">
                    {JSON.parse(selectedTemplate.color_palette || '[]').map((c, i) => (
                      <div key={i} className="flex items-center gap-1.5 rounded-lg border border-border px-2 py-1">
                        <div className="h-4 w-4 rounded border border-border" style={{ background: c }}/>
                        <code className="text-[10px] text-foreground">{c}</code>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {selectedTemplate.font_families && (
                <div>
                  <h4 className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase text-muted-foreground"><Type size={12}/> Fonts</h4>
                  <div className="flex flex-wrap gap-2">
                    {JSON.parse(selectedTemplate.font_families || '[]').map((f, i) => (
                      <code key={i} className="rounded-lg border border-border bg-background px-2 py-1 text-[10px] text-foreground">{f}</code>
                    ))}
                  </div>
                </div>
              )}
              {selectedTemplate.pattern_summary && (
                <div>
                  <h4 className="mb-2 text-xs font-bold uppercase text-muted-foreground">Summary</h4>
                  <p className="text-xs text-foreground">{selectedTemplate.pattern_summary}</p>
                </div>
              )}
              {selectedTemplate.extracted_patterns && (
                <div>
                  <h4 className="mb-2 text-xs font-bold uppercase text-muted-foreground">Extracted Patterns (JSON)</h4>
                  <pre className="max-h-48 overflow-auto rounded-lg border border-border bg-background p-3 text-[10px] text-foreground">{selectedTemplate.extracted_patterns}</pre>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}