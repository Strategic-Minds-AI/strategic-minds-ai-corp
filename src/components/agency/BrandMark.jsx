import { Compass } from 'lucide-react';

export default function BrandMark() {
  return <span className="flex items-center gap-3 text-foreground"><Compass className="h-9 w-9 stroke-[1.2]" aria-hidden="true" /><span className="font-heading text-sm font-semibold leading-tight tracking-tight">STRATEGIC MINDS<span className="mt-1 block text-[9px] font-normal tracking-[0.32em]">ARTIFICIAL INTELLIGENCE</span></span></span>;
}