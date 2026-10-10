import { useState, useMemo } from 'react';
import { Check, MapPin, Building2, Globe } from 'lucide-react';
import { US_CITIES, TOP_50_METROS } from '@/lib/usCities';

export default function CityPicker({ selected, onChange }) {
  const [mode, setMode] = useState('top50');
  const [search, setSearch] = useState('');

  const toggle = (city) => {
    const next = new Set(selected);
    if (next.has(city)) next.delete(city);
    else next.add(city);
    onChange(Array.from(next));
  };

  const filtered = useMemo(() => {
    if (mode === 'top50') {
      const topSet = new Set(TOP_50_METROS);
      return US_CITIES.filter(c => topSet.has(`${c.city}, ${c.state}`));
    }
    if (mode === 'all') {
      return US_CITIES.filter(c =>
        !search || c.city.toLowerCase().includes(search.toLowerCase()) ||
        c.state.toLowerCase().includes(search.toLowerCase())
      );
    }
    return [];
  }, [mode, search]);

  return (
    <div>
      <div className="mb-4 flex flex-wrap gap-2">
        <button onClick={() => setMode('top50')} className={`rounded-lg px-4 py-2 text-xs font-semibold ${mode === 'top50' ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground hover:bg-secondary'}`}>
          <Globe className="mr-1.5 inline h-3.5 w-3.5" /> Top 50 Metros
        </button>
        <button onClick={() => setMode('all')} className={`rounded-lg px-4 py-2 text-xs font-semibold ${mode === 'all' ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground hover:bg-secondary'}`}>
          <Building2 className="mr-1.5 inline h-3.5 w-3.5" /> All US Cities ({US_CITIES.length})
        </button>
        <button onClick={() => onChange(TOP_50_METROS)} className="ml-auto rounded-lg border border-border px-4 py-2 text-xs font-semibold text-foreground hover:bg-muted">
          Select Top 50
        </button>
        <button onClick={() => onChange([])} className="rounded-lg border border-border px-4 py-2 text-xs font-semibold text-foreground hover:bg-muted">
          Clear
        </button>
      </div>

      {mode === 'all' && (
        <input
          autoFocus
          type="text"
          placeholder="Search cities or states..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="mb-3 w-full rounded-lg border border-border bg-background px-4 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
        />
      )}

      <div className="mb-3 rounded-lg bg-primary/5 px-4 py-2 text-sm">
        <span className="font-bold text-primary">{selected.length}</span> cities selected
        {selected.length > 0 && <span className="text-muted-foreground"> — {selected.length} websites will be launched</span>}
      </div>

      <div className="max-h-[400px] space-y-1 overflow-y-auto rounded-lg border border-border bg-card p-2">
        {filtered.map(c => {
          const key = `${c.city}, ${c.state}`;
          const isSel = selected.includes(key);
          return (
            <button
              key={key}
              onClick={() => toggle(key)}
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors ${isSel ? 'bg-primary/10 text-foreground' : 'hover:bg-muted'}`}
            >
              <div className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 ${isSel ? 'border-primary bg-primary text-primary-foreground' : 'border-border'}`}>
                {isSel && <Check className="h-3 w-3" />}
              </div>
              <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="flex-1 text-foreground">{c.city}, {c.state}</span>
              <span className="text-[10px] text-muted-foreground">pop. {c.population.toLocaleString()}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}