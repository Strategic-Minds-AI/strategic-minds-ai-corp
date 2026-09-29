export default function BuildingHeroBackdrop() {
  return <>
    <div className="absolute inset-0 -z-20 overflow-hidden" aria-hidden="true">
      <img src="https://media.base44.com/images/public/6abae414a929d6dc5a55b9cc/4a8e7e298_image.png" alt="" className="absolute right-0 top-[-3%] h-[420%] min-w-full max-w-none object-cover object-right-top saturate-[1.65] contrast-110 brightness-105" />
    </div>
    <div className="pointer-events-none absolute inset-0 -z-10 bg-background/92 md:bg-gradient-to-r md:from-background md:via-background/90 md:to-transparent" />
  </>;
}