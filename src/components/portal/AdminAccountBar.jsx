import { ChevronDown } from 'lucide-react';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';

const accounts = [
  ['vercel', 'Vercel'],
  ['supabase', 'Supabase'],
  ['railway', 'Railway'],
  ['github', 'GitHub'],
  ['google-workspace', 'Agency Calendar & Drive'],
  ['ingestion', 'Drive files'],
  ['crm', 'Google contacts & CRM'],
  ['phone', 'Phone & WhatsApp'],
];

export default function AdminAccountBar({ active, onSelect }) {
  return <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <button type="button" className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground hover:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
        Accounts <ChevronDown size={15} aria-hidden="true" />
      </button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="start" className="w-56">
      {accounts.map(([id, label]) => <DropdownMenuItem key={id} onSelect={() => onSelect(id)} aria-current={active === id ? 'page' : undefined} className={active === id ? 'bg-muted font-medium text-foreground' : 'text-foreground'}>{label}</DropdownMenuItem>)}
    </DropdownMenuContent>
  </DropdownMenu>;
}