import { useState } from 'react';
import { Search, Check } from 'lucide-react';
import { UNIVERSAL_CATEGORIES } from '@/lib/universalCategories';

export default function CategoryPicker({ selected, onSelect }) {
  const [query, setQuery] = useState('');
  const filtered = UNIVERSAL_CATEGORIES.filter(c =>
    c.label.toLowerCase().includes(query.toLowerCase()) ||
    c.keyword.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div>
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          autoFocus
          type="text"
          placeholder="Search 30+ business categories..."
          value={query}
          onChange={e => setQuery(e.target.value)}
          className="w-full rounded-lg border border-border bg-background py-2.5 pl-10 pr-4 text-sm text-foreground focus:border-primary focus:outline-none"
        />
      </div>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map(cat => (
          <button
            key={cat.id}
            onClick={() => onSelect(cat.id)}
            className={`flex items-start gap-3 rounded-xl border p-3 text-left transition-all ${selected === cat.id ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'border-border bg-card hover:border-primary/40'}`}
          >
            <div className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${selected === cat.id ? 'border-primary bg-primary text-primary-foreground' : 'border-border'}`}>
              {selected === cat.id && <Check className="h-3 w-3" />}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground">{cat.label}</p>
              <p className="text-xs text-muted-foreground">"{cat.keyword}" · {cat.services.length} services</p>
              <div className="mt-1.5 flex gap-1">
                <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">${cat.averageTicket} avg</span>
              </div>
            </div>
          </button>
        ))}
      </div>
      {filtered.length === 0 && <p className="py-8 text-center text-sm text-muted-foreground">No categories match "{query}"</p>}
    </div>
  );
}