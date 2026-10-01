// Shared Vercel AI Gateway client — used by all backend functions and agent chat.
// Calls https://ai-gateway.vercel.sh/v1/chat/completions with AI_GATEWAY_API_KEY.
// This bypasses Base44 integration credits entirely — uses the workspace's own Vercel AI Gateway key.

const GATEWAY_URL = "https://ai-gateway.vercel.sh/v1/chat/completions";
const DEFAULT_MODEL = "anthropic/claude-sonnet-4-5";

export interface AIMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface AIGatewayOptions {
  model?: string;
  system?: string;
  prompt?: string;
  messages?: AIMessage[];
  temperature?: number;
  maxTokens?: number;
  jsonSchema?: Record<string, any>;
}

export interface AIGatewayResult {
  content: string;
  json: any;
  model: string;
  usage: { prompt_tokens: number; completion_tokens: number; total_tokens: number };
}

export async function callAIGateway(options: AIGatewayOptions): Promise<AIGatewayResult> {
  const apiKey = process.env.AI_GATEWAY_API_KEY;
  if (!apiKey) throw new Error("AI_GATEWAY_API_KEY secret not set");

  const model = options.model || DEFAULT_MODEL;
  const messages: AIMessage[] = [];
  if (options.system) messages.push({ role: "system", content: options.system });
  if (options.messages) messages.push(...options.messages);
  if (options.prompt) messages.push({ role: "user", content: options.prompt });

  const body: any = {
    model,
    messages,
    temperature: options.temperature ?? 0.7,
    max_tokens: options.maxTokens ?? 2000,
  };
  if (options.jsonSchema) {
    body.response_format = { type: "json_object" };
  }

  const res = await fetch(GATEWAY_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(`AI Gateway ${res.status}: ${errText.slice(0, 300)}`);
  }

  const data = await res.json();
  const content = data.choices?.[0]?.message?.content || "";

  let jsonResult: any = undefined;
  if (options.jsonSchema) {
    try {
      jsonResult = JSON.parse(content);
    } catch {
      // Try to extract JSON from markdown code blocks
      const match = content.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (match) {
        try { jsonResult = JSON.parse(match[1]); } catch { jsonResult = null; }
      } else {
        jsonResult = null;
      }
    }
  }

  return {
    content,
    json: jsonResult,
    model: data.model || model,
    usage: data.usage || { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 },
  };
}