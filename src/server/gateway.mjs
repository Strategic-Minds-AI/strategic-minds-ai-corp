// SYSTEM NOTATION: Every model request goes exclusively to the owner's Vercel AI Gateway.
import { notConfigured } from './runtime.mjs';
const ENDPOINT = 'https://ai-gateway.vercel.sh/v1';
export async function gatewayRequest(path, body, { form = false, headers = {} } = {}) {
  if (!process.env.AI_GATEWAY_API_KEY) throw notConfigured('AI_GATEWAY_API_KEY');
  const response = await fetch(`${ENDPOINT}${path}`, { method: 'POST', headers: { Authorization: `Bearer ${process.env.AI_GATEWAY_API_KEY}`, ...(!form ? { 'Content-Type': 'application/json' } : {}), ...headers }, body: form ? body : JSON.stringify(body), signal: AbortSignal.timeout(180000) });
  if (!response.ok) { const error = await response.json(); throw Object.assign(new Error(error.error?.message || `Vercel AI Gateway failed (${response.status})`), { status: 502 }); }
  return response;
}
export function validateOutput(value, schema, path = '$') {
  if (!schema) return;
  const type = Array.isArray(value) ? 'array' : value === null ? 'null' : typeof value;
  if (schema.type && schema.type !== type && !(schema.type === 'integer' && Number.isInteger(value))) throw new Error(`AI output ${path}: expected ${schema.type}, got ${type}`);
  if (schema.enum && !schema.enum.includes(value)) throw new Error(`AI output ${path}: invalid enum value`);
  for (const field of schema.required || []) if (value?.[field] === undefined || value?.[field] === null) throw new Error(`AI output ${path}.${field}: required`);
  for (const [key, child] of Object.entries(schema.properties || {})) if (value?.[key] !== undefined) validateOutput(value[key], child, `${path}.${key}`);
  if (schema.items && Array.isArray(value)) value.forEach((item, index) => validateOutput(item, schema.items, `${path}[${index}]`));
}
export async function callAIGateway(options = {}) {
  const messages = [...(options.system ? [{ role: 'system', content: options.system }] : []), ...(options.messages || []), ...(options.prompt ? [{ role: 'user', content: options.prompt }] : [])];
  if (options.jsonSchema) messages.unshift({ role: 'system', content: `Return only JSON conforming to this schema: ${JSON.stringify(options.jsonSchema)}` });
  const model = options.model && options.model !== 'automatic' && options.model.includes('/') ? options.model : process.env.AI_GATEWAY_MODEL || 'anthropic/claude-sonnet-4-5';
  const body = { model, messages, max_tokens: options.maxTokens || 8192, ...(model.startsWith('openai/gpt-5') ? {} : { temperature: options.temperature ?? 0.7 }), ...(options.jsonSchema ? { response_format: { type: 'json_object' } } : {}), ...(options.tools?.length ? { tools: options.tools, tool_choice: options.toolChoice || 'auto' } : {}) };
  const data = await (await gatewayRequest('/chat/completions', body)).json();
  const choice = data.choices?.[0];
  if (!choice || choice.finish_reason === 'length') throw new Error('Gateway response is missing or truncated');
  const content = choice.message.content || '';
  let json;
  if (options.jsonSchema) { json = JSON.parse(content.replace(/^```(?:json)?\s*/, '').replace(/\s*```$/, '')); validateOutput(json, options.jsonSchema); }
  if (!content.trim() && !choice.message.tool_calls?.length) throw new Error('Gateway returned an empty response');
  return { content, json, model: data.model || model, usage: data.usage || {}, tool_calls: choice.message.tool_calls || [], message: choice.message };
}