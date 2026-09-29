export default function BrandMark() {
  return <span className="inline-flex items-center gap-2 whitespace-nowrap text-foreground">
    <svg viewBox="0 0 32 32" width="32" height="32" className="h-8 w-8 shrink-0" aria-hidden="true" focusable="false">
      <path d="M14 3 2.5 25h23L14 3Z" className="fill-none stroke-primary" strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M22 14 14.5 29h15L22 14Z" className="fill-background stroke-primary" strokeWidth="2.5" strokeLinejoin="round" />
    </svg>
    <span className="font-heading text-base font-bold tracking-tight">Strategic Minds <span className="text-primary">AI</span></span>
  </span>;
}