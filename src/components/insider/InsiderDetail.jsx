import { useEffect } from 'react';
import { X, Clock, Bookmark, BookmarkCheck, ChevronLeft } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { CATEGORY_META } from '@/lib/insiderContent';

export default function InsiderDetail({ item, onClose, saved, onToggleSave }) {
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const meta = CATEGORY_META[item.category];
  const isSaved = saved?.includes(item.id);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-background">
      <div className="sticky top-0 z-10 flex items-center gap-3 border-b border-border bg-background/95 px-4 py-3 backdrop-blur">
        <button onClick={onClose} aria-label="Back" className="flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700">
          <ChevronLeft size={20} /> Back
        </button>
        <button
          onClick={() => onToggleSave?.(item.id)}
          aria-label={isSaved ? 'Remove from saved' : 'Save'}
          className={`ml-auto ${isSaved ? 'text-blue-600' : 'text-muted-foreground'}`}
        >
          {isSaved ? <BookmarkCheck size={20} /> : <Bookmark size={20} />}
        </button>
        <button onClick={onClose} aria-label="Close" className="text-muted-foreground hover:text-foreground">
          <X size={20} />
        </button>
      </div>
      <article className="mx-auto max-w-md px-5 py-6">
        <span className={`mb-3 inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${meta.bg} ${meta.text}`}>
          {meta.label}
        </span>
        <h1 className="mb-3 text-xl font-bold leading-tight text-foreground">{item.title}</h1>
        <div className="mb-5 flex items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1"><Clock size={12} /> {item.read_time_minutes || 3} min read</span>
          {item.publish_date && <span>{new Date(item.publish_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>}
        </div>
        {item.image_url && <img src={item.image_url} alt="" className="mb-5 rounded-lg" />}
        <div className="prose prose-sm max-w-none dark:prose-invert prose-headings:font-bold prose-p:leading-relaxed prose-li:leading-relaxed prose-strong:text-foreground prose-code:rounded prose-code:bg-muted prose-code:px-1 prose-code:py-0.5 prose-code:text-xs">
          <ReactMarkdown>{item.content_markdown}</ReactMarkdown>
        </div>
      </article>
    </div>
  );
}