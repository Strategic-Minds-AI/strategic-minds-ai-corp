export default function BuildingHeroBackdrop() {
  return <>
    <div className="absolute inset-0 -z-20 overflow-hidden" aria-hidden="true">
      <img src="/assets/agency-hero.png" alt="" className="agency-hero-image absolute right-0 top-[-3%] h-[420%] min-w-full max-w-none object-cover object-right-top saturate-[1.65] contrast-110 brightness-105" />
    </div>
    <div className="pointer-events-none absolute inset-0 -z-10 bg-background/90 lg:bg-transparent lg:bg-gradient-to-r lg:from-background lg:via-background/90 lg:to-transparent" />
  </>;
}