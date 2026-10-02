import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Cpu, Search, FileCode } from 'lucide-react';
import { ALL_AI_CONSULTING_TEMPLATES, countAIConsultingTemplates } from '@/lib/universalFactory/registry';

const CATEGORIES = [...new Set(ALL_AI_CONSULTING_TEMPLATES.map((t) => t.id.split('-')[0]))];

export default function FactoryConsulting() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('');

  const filtered = useMemo(() => {
    return ALL_AI_CONSULTING_TEMPLATES.filter((t) => {
      if (category && !t.id.startsWith(category)) return false;
      if (query) {
        const q = query.toLowerCase();
        return t.id.toLowerCase().includes(q);
      }
      return true;
    });
  }, [query, category]);

  return (
    <div className="min-h-screen bg-background font-body text-foreground">
      <header className="sticky top-0 z-10 flex min-h-16 items-center gap-3 border-b border-border bg-background px-5 py-2 pl-16">
        <button onClick={() => navigate('/factory')} className="rounded-lg p-2 text-foreground hover:bg-muted"><ArrowLeft size={20} /></button>
        <Cpu size={18} className="text-primary" />
        <span className="text-sm font-semibold text-foreground">AI Consulting Factory</span>
        <span className="text-xs text-muted-foreground">{countAIConsultingTemplates()} templates</span>
      </header>

      <div className="mx-auto max-w-5xl px-6 py-6">
        <div className="mb-4 flex gap-2">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input className="w-full rounded-lg border border-border bg-background py-2 pl-9 pr-3 text-sm text-foreground" placeholder="Search consulting templates..." value={query} onChange={(e) => setQuery(e.target.value)} />
          </div>
          <select className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground" value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="">All categories</option>
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {filtered.map((t) => (
          <div key={t.id} className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <div className="flex items-center gap-2">
              <FileCode size={14} className="text-primary" />
              <span className="font-mono text-xs font-semibold text-foreground">{t.id}</span>
              <span className="ml-auto rounded bg-primary/10 px-1.5 py-0.5 text-[10px] text-primary">v{t.version}</span>
            </div>
            {t.requires_evidence && (
              <p className="mt-2 text-[10px] font-bold uppercase text-amber-600">Evidence required</p>
            )}
          </div>
          ))}
        </div>
        {filtered.length === 0 && <p className="py-12 text-center text-sm text-muted-foreground">No templates match your search.</p>}
      </div>
    </div>
  );
}