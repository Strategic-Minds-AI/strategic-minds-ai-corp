// generateLogo — AI logo generator via Vercel AI Gateway.
// Uses the image generation endpoint to create a brand logo from config.
// SYSTEM NOTATION: Routes through Vercel AI Gateway (base44/shared/aiGateway.ts).

import { getSupabaseUser } from "../../shared/supabaseAuth.ts";

export default async function(req: Request): Promise<Response> {
  const user = await getSupabaseUser(req);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  let body;
  try { body = await req.json(); } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { brandName, primaryColor, secondaryColor, style } = body;
  if (!brandName) return Response.json({ error: "brandName is required" }, { status: 400 });

  const apiKey = process.env.AI_GATEWAY_API_KEY;
  if (!apiKey) return Response.json({ error: "AI_GATEWAY_API_KEY not configured" }, { status: 500 });

  const prompt = `Generate a professional logo for "${brandName}". Style: ${style || "Modern minimalist geometric mark"}. Primary color: ${primaryColor || "#0059ff"}, secondary: ${secondaryColor || "#0d2f96"}. Clean, scalable, on a white background. Return only the image.`;

  try {
    const res = await fetch("https://ai-gateway.vercel.sh/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3.1-flash-image-preview",
        messages: [{ role: "user", content: prompt }],
        modalities: ["text", "image"],
        stream: false,
      }),
      signal: AbortSignal.timeout(90000),
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      return Response.json({ error: `AI Gateway error: ${res.status}`, detail: errText.slice(0, 400) }, { status: 502 });
    }

    const data = await res.json();
    const imageUrl = data?.choices?.[0]?.message?.images?.[0]?.image_url?.url;

    if (!imageUrl) return Response.json({ error: "No image returned from AI Gateway" }, { status: 502 });

    return Response.json({ url: imageUrl });
  } catch (e) {
    return Response.json({ error: "Logo generation failed", detail: e.message }, { status: 500 });
  }
}