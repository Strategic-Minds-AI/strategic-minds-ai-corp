import { X } from 'lucide-react';
export default function AdminViewClose({ onClick, label = 'Close view' }) {
  return <button type="button" onClick={onClick} aria-label={label} title={label} className="ml-auto rounded-lg p-2 text-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><X size={20} /></button>;
}