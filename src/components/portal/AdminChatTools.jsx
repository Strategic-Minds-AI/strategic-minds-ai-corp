import { useRef } from 'react';
import { Plus, Paperclip, Search, ImagePlus, X } from 'lucide-react';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';

export default function AdminChatTools({ mode, onMode, attachments, onFiles, onRemove, uploading, disabled }) {
  const input = useRef(null);
  return <div className="flex min-w-0 items-center gap-2">
    <input ref={input} type="file" multiple accept="image/*,.pdf,.txt,.md,.csv,.docx" className="sr-only" aria-label="Attach photos and files" onChange={event => { onFiles([...event.target.files]); event.target.value = ''; }} />
    <DropdownMenu>
      <DropdownMenuTrigger asChild><button type="button" aria-label="Add attachments and tools" disabled={disabled || uploading} className="rounded-full p-2 text-foreground hover:bg-muted disabled:opacity-50"><Plus size={20} /></button></DropdownMenuTrigger>
      <DropdownMenuContent align="start" side="top" className="w-56">
        <DropdownMenuItem onSelect={() => input.current?.click()}><Paperclip size={16} /> Add photos & files</DropdownMenuItem>
        <DropdownMenuItem onSelect={() => onMode(mode === 'web' ? null : 'web')}><Search size={16} /> {mode === 'web' ? 'Turn off web search' : 'Search the web'}</DropdownMenuItem>
        <DropdownMenuItem onSelect={() => onMode(mode === 'image' ? null : 'image')}><ImagePlus size={16} /> {mode === 'image' ? 'Turn off image creation' : 'Create an image'}</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
    {uploading && <span role="status" className="text-xs text-muted-foreground">Uploading…</span>}
    {mode && <button type="button" onClick={() => onMode(null)} className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-1 text-xs text-foreground">{mode === 'web' ? 'Web search' : 'Create image'} <X size={12}/></button>}
    {attachments.map((file, index) => <button key={`${file.file_uri}-${index}`} type="button" onClick={() => onRemove(index)} title={`Remove ${file.name}`} className="inline-flex max-w-28 items-center gap-1 truncate rounded-full bg-muted px-2 py-1 text-xs text-foreground">{file.name}<X size={12}/></button>)}
  </div>;
}