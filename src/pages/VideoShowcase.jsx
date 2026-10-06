import { useState, useRef } from "react";
import { Helmet } from "react-helmet";
import { Play, Pause, Volume2, VolumeX, Maximize2 } from "lucide-react";
import PageHero from "@/components/agency/PageHero";

const VIDEOS = [
  {
    src: "/videos/01-hero-ai-data-architecture.mp4",
    title: "AI Data Architecture",
    description: "A digital cityscape of glowing blue circuits with a neural network constellation forming overhead.",
  },
  {
    src: "/videos/02-ai-business-transformation.mp4",
    title: "Business Transformation",
    description: "Data particles converging into a glowing growth chart that transforms into a neural network tree.",
  },
  {
    src: "/videos/03-digital-dominance-network.mp4",
    title: "Digital Dominance Network",
    description: "A city skyline at blue hour with digital connections lighting up between buildings like a living organism.",
  },
  {
    src: "/videos/04-growth-analytics-engine.mp4",
    title: "Growth Analytics Engine",
    description: "A holographic business dashboard materializing from particles with AI neural network overlays.",
  },
  {
    src: "/videos/05-strategic-partnership-web.mp4",
    title: "Strategic Partnership Web",
    description: "Interconnected nodes forming a global network sphere with blue light pulses traveling along connections.",
  },
];

function VideoCard({ video, index }) {
  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);

  const togglePlay = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) { v.play(); setIsPlaying(true); }
    else { v.pause(); setIsPlaying(false); }
  };

  const toggleMute = () => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = !v.muted;
    setIsMuted(v.muted);
  };

  const requestFullscreen = () => {
    const v = videoRef.current;
    if (v?.requestFullscreen) v.requestFullscreen();
  };

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-border bg-card shadow-md transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
      <div className="relative aspect-video overflow-hidden bg-slate-900">
        <video
          ref={videoRef}
          src={video.src}
          className="h-full w-full object-cover"
          muted={isMuted}
          loop
          playsInline
          preload="metadata"
          onClick={togglePlay}
        />
        {!isPlaying && (
          <button
            onClick={togglePlay}
            className="absolute inset-0 flex items-center justify-center bg-slate-900/40 transition-opacity hover:bg-slate-900/30"
            aria-label={`Play ${video.title}`}
          >
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/90 text-white shadow-lg transition-transform group-hover:scale-110">
              <Play className="h-7 w-7 fill-current" />
            </div>
          </button>
        )}
        <div className="absolute bottom-3 right-3 flex gap-2 opacity-0 transition-opacity group-hover:opacity-100">
          <button onClick={togglePlay} className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-900/80 text-white backdrop-blur hover:bg-primary" aria-label={isPlaying ? "Pause" : "Play"}>
            {isPlaying ? <Pause className="h-4 w-4 fill-current" /> : <Play className="h-4 w-4 fill-current" />}
          </button>
          <button onClick={toggleMute} className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-900/80 text-white backdrop-blur hover:bg-primary" aria-label={isMuted ? "Unmute" : "Mute"}>
            {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          </button>
          <button onClick={requestFullscreen} className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-900/80 text-white backdrop-blur hover:bg-primary" aria-label="Fullscreen">
            <Maximize2 className="h-4 w-4" />
          </button>
        </div>
      </div>
      <div className="p-5">
        <div className="mb-1 flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-md bg-primary/10 text-xs font-bold text-primary">
            {String(index + 1).padStart(2, "0")}
          </span>
          <h3 className="font-heading text-lg font-bold text-foreground">{video.title}</h3>
        </div>
        <p className="text-sm leading-relaxed text-muted-foreground">{video.description}</p>
      </div>
    </div>
  );
}

export default function VideoShowcase() {
  return (
    <>
      <Helmet>
        <title>AI Video Showcase — Strategic Minds AI</title>
        <meta name="description" content="AI-generated video assets showcasing digital transformation, business growth, and strategic technology concepts." />
      </Helmet>
      <main className="relative">
        <PageHero
          eyebrow="STRATEGIC MINDS AI / AI VIDEO ASSETS"
          title="AI Video Showcase"
          description="Five AI-generated video assets created through the Vercel AI Gateway, showcasing digital transformation, business growth, and strategic technology concepts. Click any video to play."
        />
        <section className="agency-container py-16">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {VIDEOS.map((video, i) => (
              <VideoCard key={video.src} video={video} index={i} />
            ))}
          </div>
        </section>
      </main>
    </>
  );
}