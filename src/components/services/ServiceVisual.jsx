export default function ServiceVisual({ index = 0 }) {
  const heights = [38, 68, 50, 90, 72, 110].map((value, position) => 25 + (value + index * (position % 2 ? 11 : 17)) % 102);
  return <div className="relative h-36 overflow-hidden bg-quaternary md:h-40" aria-hidden="true">
    <svg viewBox="0 0 440 160" preserveAspectRatio="xMidYMid slice" className="h-full w-full">
      <defs><pattern id={`service-grid-${index}`} width="22" height="22" patternUnits="userSpaceOnUse"><path d="M 22 0 L 0 0 0 22" fill="none" className="stroke-primary-foreground/10" strokeWidth=".8" /></pattern></defs>
      <rect width="440" height="160" fill={`url(#service-grid-${index})`} />
      <circle cx={320 - index % 3 * 22} cy="54" r="88" fill="none" className="stroke-primary/40" strokeWidth="1" />
      <circle cx={320 - index % 3 * 22} cy="54" r="62" fill="none" className="stroke-primary-foreground/20" strokeWidth="1" />
      <path d="M0 132 L82 102 L148 114 L212 74 L287 89 L348 34 L440 52" fill="none" className="stroke-primary" strokeWidth="2" />
      {heights.map((height, position) => <g key={position}><rect x={38 + position * 64} y={160 - height} width="32" height={height} className="fill-primary/20" /><path d={`M ${38 + position * 64} ${160 - height} V 160 M ${70 + position * 64} ${160 - height} V 160`} className="stroke-primary/60" strokeWidth="1" /><path d={`M ${38 + position * 64} ${160 - height} H ${70 + position * 64}`} className="stroke-primary" strokeWidth="2" /></g>)}
      <circle cx="212" cy="74" r="4" className="fill-primary-foreground" /><circle cx="348" cy="34" r="4" className="fill-primary-foreground" />
    </svg>
  </div>;
}