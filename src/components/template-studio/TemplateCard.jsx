import { Star, Archive, Trash2, Eye, ExternalLink, Loader2 } from 'lucide-react';

export default function TemplateCard({ template, onView, onPublish, onArchive, onDelete, scoring }) {
  const statusColor = template.status === 'published' ? 'bg-green-500/10 text-green-600' : template.status === 'archived' ? 'bg-muted text-muted-foreground' : 'bg-primary/10 text-primary';
  return (
    <div className="group overflow-hidden rounded-xl border border-border bg-card shadow-sm transition-all hover:shadow-md">
      {/* Preview area */}
      <div className="relative flex h-40 items-center justify-center bg-gradient-to-br from-muted to-background">
        {template.thumbnail_url ? (
          <img src={template.thumbnail_url} alt={template.title} className="h-full w-full object-cover" />
        ) : (
          <div className="text-center">
            <div className="mx-auto mb-1 flex h-12 w-20 items-center justify-center rounded bg-primary/5">
              <span className="text-xs font-bold text-primary">{template.gallery_name?.slice(0, 2).toUpperCase()}</span>
            </div>
            <p className="text-[10px] text-muted-foreground">No preview</p>
          </div>
        )}
        <span className={`absolute right-2 top-2 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${statusColor}`}>{template.status}</span>
        {template.is_featured && <Star size={14} className="absolute left-2 top-2 fill-yellow-400 text-yellow-400" />}
      </div>

      {/* Content */}
      <div className="p-3">
        <h3 className="truncate text-sm font-bold text-foreground">{template.title}</h3>
        <p className="mt-0.5 truncate text-xs text-muted-foreground">{template.category} {template.city ? `· ${template.city}` : ''}</p>

        {/* Quality score */}
        <div className="mt-2 flex items-center gap-2">
          <div className="flex-1">
            <div className="flex items-center justify-between text-[10px] text-muted-foreground">
              <span>Quality</span>
              <span className="font-bold text-foreground">{template.quality_score || 0}/100</span>
            </div>
            <div className="mt-0.5 h-1.5 overflow-hidden rounded-full bg-muted">
              <div className={`h-full rounded-full ${template.quality_score >= 80 ? 'bg-green-500' : template.quality_score >= 60 ? 'bg-primary' : 'bg-yellow-500'}`} style={{ width: `${template.quality_score || 0}%` }} />
            </div>
          </div>
          {scoring && <Loader2 size={12} className="animate-spin text-primary" />}
        </div>

        {/* Tags */}
        {template.tags?.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {template.tags.slice(0, 3).map((tag, i) => (
              <span key={i} className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">{tag}</span>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="mt-3 flex items-center gap-1">
          <button onClick={() => onView(template)} className="flex items-center gap-1 rounded-lg border border-border px-2 py-1.5 text-xs text-foreground hover:bg-muted"><Eye size={12} /> View</button>
          {template.status === 'draft' && <button onClick={() => onPublish(template)} className="rounded-lg border border-border px-2 py-1.5 text-xs text-green-600 hover:bg-green-500/10" title="Publish">Publish</button>}
          {template.status !== 'archived' && <button onClick={() => onArchive(template)} className="rounded-lg border border-border p-1.5 text-muted-foreground hover:bg-muted" title="Archive"><Archive size={12} /></button>}
          <button onClick={() => onDelete(template)} className="rounded-lg border border-border p-1.5 text-destructive hover:bg-destructive/10" title="Delete"><Trash2 size={12} /></button>
        </div>
      </div>
    </div>
  );
}