import { useState, useEffect } from 'react';
import { Loader2, Sparkles } from 'lucide-react';
import { fetchInsiderContent } from '@/lib/insiderContent';
import InsiderCard from './InsiderCard';

export default function InsiderFeed({ onSelect, saved, onToggleSave }) {
  const [items, setItems] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchInsiderContent({ limit: 50 })
      .then(setItems)
      .catch(() => setError('Unable to load content. Check your connection and try again.'));
  }, []);

  if (error) return <div className="px-4 py-10 text-center text-sm text-muted-foreground">{error}</div>;
  if (!items) return <div className="flex justify-center py-16"><Loader2 className="animate-spin text-blue-500" size={28} /></div>;
  if (items.length === 0) return <div className="px-4 py-10 text-center text-sm text-muted-foreground">No insider content yet. Check back soon.</div>;

  const featured = items.filter(i => i.featured);
  const rest = items.filter(i => !i.featured);

  return (
    <div className="space-y-4">
      {featured.length > 0 && (
        <div className="rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 p-4 text-white">
          <div className="mb-2 flex items-center gap-1.5 text-xs font-medium text-blue-100">
            <Sparkles size={13} /> Featured
          </div>
          {featured.slice(0, 1).map(item => (
            <div key={item.id} onClick={() => onSelect(item)} className="cursor-pointer">
              <h2 className="mb-1 text-lg font-bold leading-tight">{item.title}</h2>
              <p className="text-sm text-blue-100">{item.excerpt}</p>
            </div>
          ))}
        </div>
      )}
      <div className="space-y-3">
        {rest.map(item => (
          <InsiderCard key={item.id} item={item} onSelect={onSelect} saved={saved} onToggleSave={onToggleSave} />
        ))}
      </div>
    </div>
  );
}