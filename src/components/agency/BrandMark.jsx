import { Triangle } from 'lucide-react';

export default function BrandMark() {
  return <span className="flex items-center gap-2 whitespace-nowrap text-foreground"><span className="relative inline-flex h-8 w-8 text-primary" aria-hidden="true"><Triangle className="absolute left-0 top-0 h-7 w-7" strokeWidth={2.4} /><Triangle className="absolute bottom-0 right-0 h-5 w-5 bg-background" strokeWidth={2.4} /></span><span className="font-heading text-base font-bold tracking-tight">Strategic Minds <span className="text-primary">AI</span></span></span>;
}