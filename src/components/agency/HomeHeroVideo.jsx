const VIDEO_URL = 'https://media.base44.com/videos/public/6abae414a929d6dc5a55b9cc/80af5bcc0_Home_Hero_AI_Video.mp4';

export default function HomeHeroVideo() {
  return (
    <section className="relative border-b border-border bg-background py-20 md:py-28">
      <div className="agency-container">
        <div className="mx-auto mb-12 max-w-3xl text-center">
          <p className="agency-eyebrow mb-4">STRATEGIC MINDS AI IN MOTION</p>
          <h2 className="mb-4 font-heading text-3xl font-black tracking-tight text-foreground sm:text-4xl md:text-5xl">
            An AI partner engineered for <span className="text-primary">nationwide growth</span>
          </h2>
          <p className="text-base font-semibold leading-relaxed text-muted-foreground">
            Headquartered in South Florida, serving clients across the country. We design, deploy, and manage autonomous AI systems across every specialty we offer.
          </p>
        </div>
        <div className="relative mx-auto max-w-5xl overflow-hidden rounded-2xl border border-border bg-card shadow-lg">
          <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-br from-primary/10 via-transparent to-tertiary/10" />
          <video
            className="aspect-video w-full object-cover"
            src={VIDEO_URL}
            controls
            autoPlay
            muted
            loop
            playsInline
            aria-label="Strategic Minds AI futuristic company showcase"
          >
            Your browser does not support video playback.
          </video>
        </div>
      </div>
    </section>
  );
}