// generateViralPresets — Generates trending color presets via AI Gateway.
// Returns an array of {name, primary, secondary} color pairs.
// SYSTEM NOTATION: Routes through Vercel AI Gateway (base44/shared/aiGateway.ts).

import { getSupabaseUser } from "../../shared/supabaseAuth.ts";
import { callAIGateway } from "../../shared/aiGateway.ts";

export default async function(req: Request): Promise<Response> {
  const user = await getSupabaseUser(req);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  let body;
  try { body = await req.json(); } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const count = Math.min(body.count || 6, 12);

  try {
    const result = await callAIGateway({
      system: "You are a color trend analyst. Generate trending color palettes for SaaS/tech brands. Return JSON with a 'presets' array.",
      prompt: `Generate ${count} trending color palette presets for modern SaaS/tech brands. Each preset should have a name, a primary color (hex), and a secondary color (hex). Focus on current design trends: bold gradients, accessible contrast, modern tech aesthetics. Return JSON: {"presets": [{"name": string, "primary": "#hex", "secondary": "#hex"}, ...]}`,
      jsonSchema: {
        type: "object",
        properties: {
          presets: {
            type: "array",
            items: {
              type: "object",
              properties: {
                name: { type: "string" },
                primary: { type: "string" },
                secondary: { type: "string" },
              },
            },
          },
        },
      },
    });

    const presets = result.json?.presets || [];
    return Response.json({ presets });
  } catch (e) {
    return Response.json({ error: "Preset generation failed", detail: e.message }, { status: 500 });
  }
}