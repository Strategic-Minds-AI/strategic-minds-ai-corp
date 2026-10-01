import { useState, useEffect } from 'react';
import { Loader2, Lightbulb, Wand2, TrendingUp, Key } from 'lucide-react';
import { fetchInsiderContent, CATEGORY_META } from '@/lib/insiderContent';
import InsiderCard from './InsiderCard';

const CATEGORIES = [
  { id: 'all', label: 'All', icon: null },
  { id: 'tip', label: 'Tips', icon: Lightbulb },
  { id: 'trick', label: 'Tricks', icon: Wand2 },
  { id: 'wealth', label: 'Wealth', icon: TrendingUp },
  { id: 'secret', label: 'Secrets', icon: Key },
];

export default function InsiderLibrary({ onSelect, saved, onToggleSave }) {
  const [items, setItems] = useState(null);
  const [filter, setFilter] = useState('all');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchInsiderContent({ limit: 100 })
      .then(setItems)
      .catch(() => setError('Unable to load library.'));
  }, []);

  if (error) return <div className="px-4 py-10 text-center text-sm text-muted-foreground">{error}</div>;
  if (!items) return <div className="flex justify-center py-16"><Loader2 className="animate-spin text-blue-500" size={28} /></div>;

  const filtered = filter === 'all' ? items : items.filter(i => i.category === filter);

  return (
    <div className="space-y-4">
      <div className="flex gap-2 overflow-x-auto pb-1">
        {CATEGORIES.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setFilter(id)}
            className={`flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${filter === id ? 'bg-blue-600 text-white' : 'bg-muted text-muted-foreground hover:bg-muted/70'}`}
          >
            {Icon && <Icon size={13} />} {label}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-1 gap-3">
        {filtered.map(item => (
          <InsiderCard key={item.id} item={item} onSelect={onSelect} saved={saved} onToggleSave={onToggleSave} />
        ))}
      </div>
      {filtered.length === 0 && <p className="py-8 text-center text-sm text-muted-foreground">No content in this category yet.</p>}
    </div>
  );
}