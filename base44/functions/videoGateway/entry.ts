// videoGateway — CapCut-parity video generation via the Vercel AI Gateway video API.
// Supports text-to-video AND image-to-video (first frame), 4-30s clips, multiple models.
// SYSTEM NOTATION: Routes through the Vercel AI Gateway (base44.asServiceRole.aiGateway) — never credit-blocked integrations.
import OpenAI from "npm:openai@6.45.0";
import { getSupabaseUser } from "../../shared/supabaseAuth.ts";

export default async function(req: Request): Promise<Response> {
  try {
    const user = await getSupabaseUser(req);
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
    if (user.role !== "admin") return Response.json({ error: "Admin access required" }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const action = body.action || "create";

    // Use the platform SDK's service-role AI Gateway connection (bills to integration credits,
    // no provider key needed). We import the SDK lazily to stay compatible with the owned-client fallback.
    const { createClientFromRequest } = await import("../../shared/ownedClient.ts");
    const base44 = createClientFromRequest(req);
    const { baseURL, token, headers } = base44.asServiceRole.aiGateway.connection();
    const videos = new OpenAI({ baseURL, apiKey: token, defaultHeaders: headers }).videos;

    if (action === "create") {
      const { prompt, model, seconds, aspect_ratio, resolution, first_frame_url, generate_audio, seed } = body;
      if (!prompt || typeof prompt !== "string") return Response.json({ error: "prompt is required" }, { status: 400 });

      const request: any = {
        model: model || "seedance_2_fast",
        prompt,
        seconds: seconds || 8,
        aspect_ratio: aspect_ratio || "16:9",
        resolution: resolution || "720p",
        generate_audio: generate_audio !== false,
      };
      if (seed != null) request.seed = seed;

      // Image-to-video: attach the first frame image.
      if (first_frame_url) {
        request.frame_images = [{
          type: "image_url",
          image_url: { url: first_frame_url },
          frame_type: "first_frame",
        }];
      }

      const result = await videos.create(request, { maxRetries: 0 });
      return Response.json(result, { status: 202 });
    }

    if (action === "retrieve") {
      const { videoId } = body;
      if (!videoId) return Response.json({ error: "videoId is required" }, { status: 400 });
      const result = await videos.retrieve(videoId);
      return Response.json(result);
    }

    if (action === "cost_preview") {
      const { prompt, model, seconds, aspect_ratio, resolution, first_frame_url, generate_audio } = body;
      if (!prompt) return Response.json({ error: "prompt is required" }, { status: 400 });
      const request: any = {
        model: model || "seedance_2_fast",
        prompt,
        seconds: seconds || 8,
        aspect_ratio: aspect_ratio || "16:9",
        resolution: resolution || "720p",
        generate_audio: generate_audio !== false,
        dry_run: true,
      };
      if (first_frame_url) {
        request.frame_images = [{ type: "image_url", image_url: { url: first_frame_url }, frame_type: "first_frame" }];
      }
      const estimate = await videos.create(request, { maxRetries: 0 });
      return Response.json(estimate);
    }

    return Response.json({ error: `Unknown action: ${action}` }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Video gateway failed" }, { status: 500 });
  }
}