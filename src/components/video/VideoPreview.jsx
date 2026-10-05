import React, { useEffect, useRef, useState } from "react";

const FILTERS = {
  none: "none",
  warm: "sepia(0.35) saturate(1.3) hue-rotate(-10deg)",
  cool: "hue-rotate(180deg) saturate(1.2) brightness(1.05)",
  vivid: "saturate(1.6) contrast(1.15)",
  noir: "grayscale(1) contrast(1.3) brightness(0.95)",
  fade: "contrast(0.85) brightness(1.1) saturate(0.8)",
};

export default function VideoPreview({ clips, edits, currentClipIndex, onClipChange }) {
  const videoRef = useRef(null);
  const [activeOverlay, setActiveOverlay] = useState(null);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    v.currentTime = edits.trim_in || 0;
  }, [currentClipIndex, edits.trim_in]);

  const clip = clips[currentClipIndex];
  const overlays = (edits.text_overlays || []).filter((o) => {
    const t = videoRef.current?.currentTime || 0;
    return t >= o.start && t <= o.end;
  });

  return (
    <div className="flex flex-col gap-3">
      <div className="relative overflow-hidden rounded-xl border border-border bg-black aspect-video">
        {clip ? (
          <video
            ref={videoRef}
            key={clip.url}
            src={clip.url}
            className="h-full w-full object-contain"
            style={{ filter: FILTERS[edits.filter] || "none" }}
            controls
            playsInline
            onTimeUpdate={(e) => {
              const t = e.target.currentTime;
              if (edits.trim_out && t > edits.trim_out) e.target.currentTime = edits.trim_in || 0;
              setActiveOverlay((edits.text_overlays || []).find((o) => t >= o.start && t <= o.end) || null);
            }}
          >
            Your browser does not support video playback.
          </video>
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            No clips yet — generate one to start editing.
          </div>
        )}
        {activeOverlay && (
          <div
            className="pointer-events-none absolute font-bold drop-shadow-lg"
            style={{
              left: `${activeOverlay.x}%`, top: `${activeOverlay.y}%`,
              fontSize: `${activeOverlay.font_size || 24}px`,
              color: activeOverlay.color || "#ffffff",
              background: activeOverlay.bg || "transparent",
              padding: activeOverlay.bg ? "4px 10px" : 0,
              borderRadius: 6,
            }}
          >
            {activeOverlay.text}
          </div>
        )}
      </div>
      {clips.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {clips.map((c, i) => (
            <button
              key={i}
              onClick={() => onClipChange(i)}
              className={`flex-shrink-0 rounded-lg border p-2 text-xs ${i === currentClipIndex ? "border-primary bg-primary/10 text-primary" : "border-border bg-card text-muted-foreground"}`}
            >
              Clip {i + 1} · {c.seconds}s
            </button>
          ))}
        </div>
      )}
    </div>
  );
}