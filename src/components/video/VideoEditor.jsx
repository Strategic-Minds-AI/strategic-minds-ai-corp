import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, Music } from "lucide-react";
import { base44 } from "@/api/base44Client";

const FILTERS = ["none", "warm", "cool", "vivid", "noir", "fade"];
const TRANSITIONS = ["none", "fade", "slide", "zoom"];

export default function VideoEditor({ edits, setEdits, totalDuration }) {
  const update = (patch) => setEdits({ ...edits, ...patch });

  const addOverlay = () => {
    const overlays = [...(edits.text_overlays || []), { text: "New text", x: 50, y: 80, start: 0, end: 3, font_size: 28, color: "#ffffff", bg: "" }];
    update({ text_overlays: overlays });
  };
  const updateOverlay = (i, patch) => {
    const overlays = [...(edits.text_overlays)];
    overlays[i] = { ...overlays[i], ...patch };
    update({ text_overlays: overlays });
  };
  const removeOverlay = (i) => update({ text_overlays: (edits.text_overlays || []).filter((_, idx) => idx !== i) });

  const uploadMusic = async (file) => {
    const { file_url } = await base44.integrations.Core.UploadPublicFile({ file });
    update({ music_url: file_url });
  };

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <Label>Filter</Label>
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <button key={f} onClick={() => update({ filter: f })}
              className={`rounded-lg border px-3 py-1.5 text-xs ${edits.filter === f ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground"}`}>
              {f}
            </button>
          ))}
        </div>
      </div>
      <div className="space-y-2">
        <Label>Transition between clips</Label>
        <div className="flex flex-wrap gap-2">
          {TRANSITIONS.map((t) => (
            <button key={t} onClick={() => update({ transition: t })}
              className={`rounded-lg border px-3 py-1.5 text-xs ${edits.transition === t ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground"}`}>
              {t}
            </button>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label>Trim in (s)</Label>
          <Input type="number" min={0} step={0.5} value={edits.trim_in || 0}
            onChange={(e) => update({ trim_in: Number(e.target.value) })} className="h-9" />
        </div>
        <div className="space-y-1">
          <Label>Trim out (s)</Label>
          <Input type="number" min={0} step={0.5} value={edits.trim_out || totalDuration}
            onChange={(e) => update({ trim_out: Number(e.target.value) })} className="h-9" />
        </div>
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>Text overlays</Label>
          <Button size="sm" variant="outline" onClick={addOverlay}><Plus className="h-3 w-3" /> Add</Button>
        </div>
        <div className="space-y-2">
          {(edits.text_overlays || []).map((o, i) => (
            <div key={i} className="rounded-lg border border-border p-2 space-y-2 bg-muted/40">
              <div className="flex gap-2">
                <Input value={o.text} onChange={(e) => updateOverlay(i, { text: e.target.value })} className="h-8 text-xs" />
                <Button size="sm" variant="ghost" onClick={() => removeOverlay(i)}><Trash2 className="h-3 w-3" /></Button>
              </div>
              <div className="grid grid-cols-4 gap-1.5">
                <Input type="number" value={o.start} placeholder="start" onChange={(e) => updateOverlay(i, { start: Number(e.target.value) })} className="h-7 text-xs" />
                <Input type="number" value={o.end} placeholder="end" onChange={(e) => updateOverlay(i, { end: Number(e.target.value) })} className="h-7 text-xs" />
                <Input type="number" value={o.x} placeholder="x%" onChange={(e) => updateOverlay(i, { x: Number(e.target.value) })} className="h-7 text-xs" />
                <Input type="number" value={o.y} placeholder="y%" onChange={(e) => updateOverlay(i, { y: Number(e.target.value) })} className="h-7 text-xs" />
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                <Input type="number" value={o.font_size} placeholder="size" onChange={(e) => updateOverlay(i, { font_size: Number(e.target.value) })} className="h-7 text-xs" />
                <Input type="color" value={o.color} onChange={(e) => updateOverlay(i, { color: e.target.value })} className="h-7 w-full p-0.5" />
                <Input type="color" value={o.bg || "#000000"} onChange={(e) => updateOverlay(i, { bg: e.target.value })} className="h-7 w-full p-0.5" />
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="space-y-2">
        <Label>Background music</Label>
        <div className="flex items-center gap-2">
          <input type="file" accept="audio/*" id="music-upload" className="hidden"
            onChange={(e) => e.target.files?.[0] && uploadMusic(e.target.files[0])} />
          <Button size="sm" variant="outline" onClick={() => document.getElementById("music-upload").click()}>
            <Music className="h-3 w-3" /> Upload track
          </Button>
          {edits.music_url && <span className="text-xs text-primary truncate max-w-[140px]">Track attached</span>}
        </div>
        {edits.music_url && (
          <Input type="range" min={0} max={1} step={0.1} value={edits.music_volume ?? 0.4}
            onChange={(e) => update({ music_volume: Number(e.target.value) })} className="h-8" />
        )}
      </div>
    </div>
  );
}