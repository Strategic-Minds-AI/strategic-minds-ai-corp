import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import VideoGenerator from "@/components/video/VideoGenerator";
import VideoEditor from "@/components/video/VideoEditor";
import VideoPreview from "@/components/video/VideoPreview";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Save, Film, Trash2 } from "lucide-react";

export default function VideoStudio() {
  const [title, setTitle] = useState("");
  const [clips, setClips] = useState([]);
  const [edits, setEdits] = useState({ text_overlays: [], filter: "none", trim_in: 0, trim_out: 0, transition: "none", music_url: "", music_volume: 0.4 });
  const [currentClip, setCurrentClip] = useState(0);
  const [projects, setProjects] = useState([]);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  const totalDuration = clips.reduce((s, c) => s + (c.seconds || 0), 0);

  useEffect(() => { loadProjects(); }, []);
  useEffect(() => { setEdits((e) => ({ ...e, trim_out: totalDuration })); }, [totalDuration]);

  const loadProjects = async () => {
    try {
      const res = await base44.entities.VideoProject.filter({}, { sort: "-created_date", limit: 20, fields: ["title", "status", "output_url", "clips"] });
      setProjects(res.items || []);
    } catch { /* ignore */ } finally { setLoading(false); }
  };

  const onClipGenerated = (clip) => {
    const newClips = [...clips, { ...clip, order: clips.length }];
    setClips(newClips);
    setCurrentClip(newClips.length - 1);
  };

  const save = async () => {
    if (!title.trim()) { setTitle("Untitled video " + new Date().toLocaleDateString()); return; }
    setSaving(true);
    try {
      await base44.entities.VideoProject.create({
        title, clips, edits,
        status: clips.length ? "ready" : "draft",
        output_url: clips[clips.length - 1]?.url || "",
      });
      await loadProjects();
    } finally { setSaving(false); }
  };

  const removeClip = (i) => {
    setClips(clips.filter((_, idx) => idx !== i));
    setCurrentClip(0);
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-bold text-foreground">
              <Film className="h-6 w-6 text-primary" /> Video Studio
            </h1>
            <p className="text-sm text-muted-foreground">AI video generator & editor — text-to-video, image-to-video, multi-clip timelines up to 60s.</p>
          </div>
          <Button onClick={save} disabled={saving || !clips.length}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save project
          </Button>
        </div>

        <div className="mb-4">
          <Label htmlFor="title">Project title</Label>
          <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="My AI video" className="max-w-md" />
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_360px_300px]">
          <div className="space-y-4">
            <VideoPreview clips={clips} edits={edits} currentClipIndex={currentClip} onClipChange={setCurrentClip} />
            {clips.length > 0 && (
              <div className="flex items-center justify-between rounded-lg border border-border p-3">
                <span className="text-xs text-muted-foreground">Total: {totalDuration}s · {clips.length} clip{clips.length !== 1 ? "s" : ""}</span>
                <Button size="sm" variant="ghost" onClick={() => removeClip(currentClip)}>
                  <Trash2 className="h-3 w-3" /> Remove current clip
                </Button>
              </div>
            )}
          </div>
          <div className="rounded-xl border border-border bg-card p-4">
            <h3 className="mb-3 text-sm font-semibold text-foreground">Generate</h3>
            <VideoGenerator onClipGenerated={onClipGenerated} />
          </div>
          <div className="rounded-xl border border-border bg-card p-4">
            <h3 className="mb-3 text-sm font-semibold text-foreground">Edit</h3>
            <VideoEditor edits={edits} setEdits={setEdits} totalDuration={totalDuration} />
          </div>
        </div>

        <div className="mt-8">
          <h3 className="mb-3 text-sm font-semibold text-foreground">Saved projects</h3>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : projects.length === 0 ? (
            <p className="text-sm text-muted-foreground">No saved projects yet.</p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {projects.map((p) => (
                <div key={p.id} className="rounded-lg border border-border bg-card p-3">
                  <div className="flex items-center justify-between">
                    <span className="truncate text-sm font-medium text-foreground">{p.title}</span>
                    <span className="text-xs text-muted-foreground">{p.status}</span>
                  </div>
                  {p.output_url && <video src={p.output_url} className="mt-2 aspect-video w-full rounded bg-black object-contain" controls />}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}