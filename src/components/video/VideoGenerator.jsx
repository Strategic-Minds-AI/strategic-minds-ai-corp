import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Sparkles, Upload, DollarSign } from "lucide-react";
import { base44 } from "@/api/base44Client";

const MODELS = [
  { id: "seedance_2_fast", label: "Seedance 2 Fast (4-15s)", max: 15 },
  { id: "seedance_2_5", label: "Seedance 2.5 (4-30s)", max: 30 },
  { id: "veo_3_1_fast", label: "Veo 3.1 Fast (4-8s)", max: 8 },
  { id: "kling_3", label: "Kling 3 (3-15s)", max: 15 },
  { id: "grok_imagine_video_1_5", label: "Grok Imagine 1.5 (1-15s)", max: 15 },
];

export default function VideoGenerator({ onClipGenerated, onCost }) {
  const [prompt, setPrompt] = useState("");
  const [model, setModel] = useState("seedance_2_fast");
  const [seconds, setSeconds] = useState(8);
  const [aspect, setAspect] = useState("16:9");
  const [resolution, setResolution] = useState("720p");
  const [audio, setAudio] = useState(true);
  const [firstFrameUrl, setFirstFrameUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [polling, setPolling] = useState(false);
  const [error, setError] = useState("");
  const [cost, setCost] = useState(null);

  const maxSeconds = MODELS.find((m) => m.id === model)?.max || 15;

  const uploadImage = async (file) => {
    setUploading(true);
    setError("");
    try {
      const { file_url } = await base44.integrations.Core.UploadPublicFile({ file });
      setFirstFrameUrl(file_url);
    } catch (e) {
      setError("Image upload failed: " + e.message);
    } finally {
      setUploading(false);
    }
  };

  const previewCost = async () => {
    setError("");
    try {
      const res = await base44.functions.invoke("videoGateway", {
        action: "cost_preview", prompt, model, seconds, aspect_ratio: aspect, resolution, first_frame_url: firstFrameUrl, generate_audio: audio,
      });
      setCost(res.data?.usage?.base44_credits || null);
      onCost?.(res.data?.usage?.base44_credits);
    } catch (e) { setError("Cost preview failed: " + e.message); }
  };

  const generate = async () => {
    if (!prompt.trim()) { setError("Enter a prompt first."); return; }
    setGenerating(true); setError(""); setPolling(false);
    try {
      let res = await base44.functions.invoke("videoGateway", {
        action: "create", prompt, model, seconds: Math.min(seconds, maxSeconds), aspect_ratio: aspect, resolution, first_frame_url: firstFrameUrl, generate_audio: audio,
      });
      const videoId = res.data?.id;
      if (!videoId) throw new Error(res.data?.error || "No video ID returned");

      setPolling(true);
      let attempts = 0;
      let video = res.data;
      const isProcessing = (s) => s === "queued" || s === "in_progress";
      while (isProcessing(video.status) && attempts < 40) {
        await new Promise((r) => setTimeout(r, 15000));
        res = await base44.functions.invoke("videoGateway", { action: "retrieve", videoId });
        video = res.data;
        attempts++;
      }
      setPolling(false);
      if (video.status === "failed") throw new Error(video.error?.message || "Generation failed");
      if (!video.url) throw new Error("Video not ready after polling");
      onClipGenerated({ url: video.url, prompt, seconds: Math.min(seconds, maxSeconds), gateway_video_id: videoId });
    } catch (e) {
      setError(e.message || "Generation failed");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="prompt">Prompt</Label>
        <Textarea id="prompt" value={prompt} onChange={(e) => setPrompt(e.target.value)} rows={3}
          placeholder="A futuristic AI company headquarters in South Florida, aerial drone shot, blue glass towers, golden hour" />
      </div>
      <div className="space-y-2">
        <Label>First frame image (image-to-video)</Label>
        <div className="flex items-center gap-3">
          <input type="file" accept="image/*" onChange={(e) => e.target.files?.[0] && uploadImage(e.target.files[0])}
            className="hidden" id="first-frame-upload" />
          <Button type="button" variant="outline" size="sm" disabled={uploading}
            onClick={() => document.getElementById("first-frame-upload").click()}>
            {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />} Upload
          </Button>
          {firstFrameUrl && <span className="text-xs text-primary truncate max-w-[180px]">Image attached</span>}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label>Model</Label>
          <select value={model} onChange={(e) => { setModel(e.target.value); }} className="xa-input h-10 text-sm">
            {MODELS.map((m) => <option key={m.id} value={m.id}>{m.label}</option>)}
          </select>
        </div>
        <div className="space-y-2">
          <Label>Duration (s)</Label>
          <Input type="number" min={4} max={maxSeconds} value={seconds}
            onChange={(e) => setSeconds(Math.min(Number(e.target.value), maxSeconds))} className="h-10" />
        </div>
        <div className="space-y-2">
          <Label>Aspect ratio</Label>
          <select value={aspect} onChange={(e) => setAspect(e.target.value)} className="xa-input h-10 text-sm">
            {["16:9", "9:16", "1:1", "21:9", "3:4", "4:3"].map((a) => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>
        <div className="space-y-2">
          <Label>Resolution</Label>
          <select value={resolution} onChange={(e) => setResolution(e.target.value)} className="xa-input h-10 text-sm">
            {["480p", "720p", "1080p"].map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={audio} onChange={(e) => setAudio(e.target.checked)} />
        Generate audio
      </label>
      {error && <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}
      {cost != null && <div className="text-xs text-muted-foreground">Estimated cost: {cost} credits</div>}
      <div className="flex gap-2">
        <Button onClick={generate} disabled={generating} className="flex-1">
          {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          {generating ? (polling ? "Rendering video…" : "Submitting…") : "Generate clip"}
        </Button>
        <Button onClick={previewCost} variant="outline" disabled={!prompt.trim()}>
          <DollarSign className="h-4 w-4" /> Cost
        </Button>
      </div>
    </div>
  );
}