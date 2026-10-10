import { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, Upload, Loader2, RefreshCw, LayoutGrid, Search, Sparkles, Code2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { TEMPLATE_GALLERIES } from '@/lib/templateGalleries';
import { base44 } from '@/api/base44Client';
import GalleryGrid from '@/components/template-studio/GalleryGrid';
import TemplateCard from '@/components/template-studio/TemplateCard';
import UploadPanel from '@/components/template-studio/UploadPanel';
import TemplatePreview from '@/components/template-studio/TemplatePreview';

export default function TemplateStudio() {
  const [selectedGallery, setSelectedGallery] = useState(null);
  const [templates, setTemplates] = useState([]);
  const [counts, setCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [previewId, setPreviewId] = useState(null);
  const [search, setSearch] = useState('');
  const [scoringId, setScoringId] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');

  const loadGalleries = useCallback(async () => {
    try {
      const res = await base44.functions.invoke('templateStudio', { action: 'listGalleries' });
      const countMap = {};
      (res.data?.galleries || []).forEach(g => { countMap[g.id] = g.template_count; });
      setCounts(countMap);
    } catch {}
  }, []);

  const loadTemplates = useCallback(async () => {
    if (!selectedGallery) return;
    setLoading(true);
    try {
      const res = await base44.functions.invoke('templateStudio', {
        action: 'list',
        gallery_id: selectedGallery,
        status: statusFilter === 'all' ? undefined : statusFilter,
        limit: 100,
      });
      setTemplates(res.data?.templates || []);
    } catch {}
    setLoading(false);
  }, [selectedGallery, statusFilter]);

  useEffect(() => { loadGalleries(); }, [loadGalleries]);
  useEffect(() => { if (selectedGallery) loadTemplates(); }, [loadTemplates]);

  const handlePublish = async (t) => {
    await base44.functions.invoke('templateStudio', { action: 'publish', template_id: t.id });
    loadTemplates();
  };
  const handleArchive = async (t) => {
    await base44.functions.invoke('templateStudio', { action: 'archive', template_id: t.id });
    loadTemplates();
  };
  const handleDelete = async (t) => {
    if (!confirm(`Delete "${t.title}"?`)) return;
    await base44.functions.invoke('templateStudio', { action: 'delete', template_id: t.id });
    loadTemplates();
    loadGalleries();
  };
  const handleScore = async (t) => {
    setScoringId(t.id);
    try {
      await base44.functions.invoke('templateStudio', { action: 'score', template_id: t.id });
      loadTemplates();
    } catch {}
    setScoringId(null);
  };

  const filtered = templates.filter(t =>
    !search || t.title.toLowerCase().includes(search.toLowerCase()) || t.category?.toLowerCase().includes(search.toLowerCase())
  );

  const gallery = TEMPLATE_GALLERIES.find(g => g.id === selectedGallery);

  return (
    <div className="min-h-screen bg-background font-body text-foreground">
      <header className="sticky top-0 z-10 flex min-h-16 items-center gap-3 border-b border-border bg-background px-5 py-2 pl-16">
        <Link to="/agents" className="rounded-lg p-2 text-foreground hover:bg-muted"><ArrowLeft size={20} /></Link>
        <LayoutGrid size={18} className="text-primary" />
        <span className="text-sm font-semibold text-foreground">Template Studio</span>
        <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-primary">20 Galleries · GPT Upload</span>
        <button onClick={loadGalleries} className="ml-auto rounded-lg p-2 text-foreground hover:bg-muted" title="Refresh"><RefreshCw size={16} /></button>
        <button onClick={() => setShowUpload(true)} disabled={!selectedGallery} className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-40">
          <Upload size={16} /> Upload to Gallery
        </button>
      </header>

      <div className="mx-auto max-w-6xl px-6 py-6">
        {/* Gallery overview when none selected */}
        {!selectedGallery && (
          <>
            <div className="mb-5 flex items-center gap-3">
              <Sparkles size={20} className="text-primary" />
              <div>
                <h1 className="text-xl font-bold text-foreground">20 Template Galleries</h1>
                <p className="text-sm text-muted-foreground">Each gallery is a distinct design language. GPT uploads generated websites into the matching gallery.</p>
              </div>
            </div>
            <GalleryGrid counts={counts} onSelect={setSelectedGallery} selected={selectedGallery} />
            <div className="mt-6 rounded-xl border border-border bg-muted/30 p-4">
              <div className="flex items-start gap-3">
                <Code2 size={20} className="mt-0.5 text-primary" />
                <div>
                  <h3 className="text-sm font-bold text-foreground">GPT Upload Integration</h3>
                  <p className="mt-1 text-xs text-muted-foreground">GPT can upload websites via the <code className="rounded bg-muted px-1">templateStudio</code> backend function. Pass <code className="rounded bg-muted px-1">action: "upload"</code> with the gallery_id, title, html_content, and optional css/js. All AI scoring routes through the Vercel AI Gateway — no Base44 integration credits consumed.</p>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Gallery detail when one is selected */}
        {selectedGallery && (
          <>
            <button onClick={() => setSelectedGallery(null)} className="mb-4 flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
              <ArrowLeft size={14} /> All galleries
            </button>

            <div className="mb-5 flex items-start justify-between">
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-xl font-bold text-foreground">{gallery?.name}</h1>
                  <div className="flex gap-1">
                    {gallery?.palette.map((c, i) => (
                      <div key={i} className="h-5 w-5 rounded" style={{ backgroundColor: c }} />
                    ))}
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">{gallery?.style} · {gallery?.tone} tone</p>
                <p className="mt-1 text-xs text-muted-foreground">{gallery?.description}</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-foreground">{templates.length}</p>
                <p className="text-xs text-muted-foreground">templates</p>
              </div>
            </div>

            {/* Filters */}
            <div className="mb-4 flex items-center gap-3">
              <div className="flex flex-1 items-center gap-2 rounded-lg border border-border bg-background px-3 py-2">
                <Search size={14} className="text-muted-foreground" />
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search templates..." className="flex-1 bg-transparent text-sm text-foreground outline-none" />
              </div>
              <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground">
                <option value="all">All</option>
                <option value="draft">Drafts</option>
                <option value="published">Published</option>
                <option value="archived">Archived</option>
              </select>
            </div>

            {/* Template grid */}
            {loading ? (
              <div className="flex items-center justify-center py-20 text-muted-foreground"><Loader2 size={24} className="animate-spin" /></div>
            ) : filtered.length === 0 ? (
              <div className="py-12 text-center">
                <Upload size={40} className="mx-auto mb-4 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">No templates in this gallery yet.</p>
                <button onClick={() => setShowUpload(true)} className="mt-3 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">Upload First Template</button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                {filtered.map(t => (
                  <TemplateCard key={t.id} template={t} onView={(tm) => setPreviewId(tm.id)} onPublish={handlePublish} onArchive={handleArchive} onDelete={handleDelete} scoring={scoringId === t.id} />
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {showUpload && <UploadPanel galleryId={selectedGallery || 'aurora'} onClose={() => setShowUpload(false)} onUploaded={() => { loadTemplates(); loadGalleries(); }} />}
      {previewId && <TemplatePreview templateId={previewId} onClose={() => setPreviewId(null)} />}
    </div>
  );
}