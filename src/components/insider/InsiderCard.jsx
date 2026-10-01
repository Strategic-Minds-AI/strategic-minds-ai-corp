import { Lightbulb, Wand2, TrendingUp, Key, Clock, Bookmark, BookmarkCheck } from 'lucide-react';
import { CATEGORY_META } from '@/lib/insiderContent';

const ICONS = { Lightbulb, Wand2, TrendingUp, Key };

export default function InsiderCard({ item, onSelect, saved, onToggleSave }) {
  const meta = CATEGORY_META[item.category];
  const Icon = ICONS[meta.icon];
  const isSaved = saved?.includes(item.id);

  return (
    <article
      onClick={() => onSelect(item)}
      className="group cursor-pointer rounded-xl border border-border bg-card p-4 transition-all hover:border-blue-300 hover:shadow-md dark:hover:border-blue-700"
    >
      <div className="mb-2 flex items-center gap-2">
        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${meta.bg} ${meta.text}`}>
          <Icon size={11} /> {meta.label}
        </span>
        <span className="ml-auto flex items-center gap-1 text-[10px] text-muted-foreground">
          <Clock size={10} /> {item.read_time_minutes || 3} min
        </span>
        {onToggleSave && (
          <button
            onClick={(e) => { e.stopPropagation(); onToggleSave(item.id); }}
            aria-label={isSaved ? 'Remove from saved' : 'Save for later'}
            className={`ml-1 ${isSaved ? 'text-blue-600' : 'text-muted-foreground hover:text-blue-500'}`}
          >
            {isSaved ? <BookmarkCheck size={15} /> : <Bookmark size={15} />}
          </button>
        )}
      </div>
      <h3 className="mb-1.5 text-sm font-bold leading-snug text-foreground">{item.title}</h3>
      <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">{item.excerpt}</p>
    </article>
  );
}