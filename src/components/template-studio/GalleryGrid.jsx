import { useState } from 'react';
import { TEMPLATE_GALLERIES } from '@/lib/templateGalleries';
import { Palette, Layers, Upload, Star, TrendingUp } from 'lucide-react';

export default function GalleryGrid({ counts, onSelect, selected }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {TEMPLATE_GALLERIES.map((g, i) => {
        const count = counts[g.id] || 0;
        const isSelected = selected === g.id;
        return (
          <button
            key={g.id}
            onClick={() => onSelect(g.id)}
            className={`group relative overflow-hidden rounded-xl border-2 p-4 text-left transition-all ${isSelected ? 'border-primary shadow-lg' : 'border-border hover:border-primary/40'}`}
          >
            {/* Color preview strip */}
            <div className="mb-3 flex h-16 overflow-hidden rounded-lg">
              {g.palette.map((color, ci) => (
                <div key={ci} className="flex-1" style={{ backgroundColor: color }} />
              ))}
            </div>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-foreground">{g.name}</h3>
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{g.tone}</p>
              </div>
              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">{count}</span>
            </div>
            <p className="mt-2 text-[11px] leading-snug text-muted-foreground">{g.style}</p>
            <div className="mt-2 flex items-center gap-1 text-[10px] text-muted-foreground">
              <Layers size={10} /> #{i + 1} of 20
            </div>
          </button>
        );
      })}
    </div>
  );
}