import { Home, Library, Info } from 'lucide-react';

const TABS = [
  { id: 'feed', label: 'Feed', icon: Home },
  { id: 'library', label: 'Library', icon: Library },
  { id: 'about', label: 'About', icon: Info },
];

export default function InsiderBottomNav({ tab, onTab }) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="mx-auto flex max-w-md">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => onTab(id)}
            className={`flex flex-1 flex-col items-center gap-1 py-2.5 text-xs transition-colors ${tab === id ? 'text-blue-600 dark:text-blue-400' : 'text-muted-foreground'}`}
          >
            <Icon size={20} strokeWidth={tab === id ? 2.5 : 2} />
            <span className={tab === id ? 'font-semibold' : ''}>{label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}