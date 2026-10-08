import { createHash, timingSafeEqual } from "node:crypto";
export const MAX_PREVIEW_BYTES = 30_000;
export function secureEqual(a,b) {
  if (typeof a !== "string" || typeof b !== "string" || !a || !b) return false;
  const x = Buffer.from(a), y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x,y);
}
export function sha256(value) { return createHash("sha256").update(value).digest("hex"); }
export function parsePack(body) {
  if (!body || typeof body !== "object" || Array.isArray(body)) throw new Error("invalid_body");
  const pack = body.pack ?? body;
  if (!pack || typeof pack !== "object" || Array.isArray(pack)) throw new Error("invalid_pack");
  const name = pack.name?.trim();
  if (typeof name !== "string" || !name || name.length > 180) throw new Error("invalid_name");
  if (pack.kind && pack.kind !== "web_pack") throw new Error("unsupported_kind");
  if (typeof pack.preview_html !== "string") throw new Error("preview_html_required");
  const html = pack.preview_html;
  const brand = typeof pack.brand_tokens === "string" ? JSON.parse(pack.brand_tokens) : pack.brand_tokens ?? {};
  if (!brand || typeof brand !== "object" || Array.isArray(brand)) throw new Error("invalid_brand_tokens");
  const bytes = Buffer.byteLength(html,"utf8");
  const digest = sha256(html);
  return {
    name, kind:"web_pack", source:"gpt_sync",
    submitted_by_label: typeof pack.submitted_by_label === "string" ? pack.submitted_by_label.slice(0,80):"GPT",
    preview_html: bytes <= MAX_PREVIEW_BYTES ? html : null,
    requires_external_artifact: bytes > MAX_PREVIEW_BYTES,
    html_bytes: bytes, sha256: digest, brand_tokens:brand
  };
}
export function toLegacyBody(p,adapter) {
  if(p.requires_external_artifact) throw new Error("artifact_storage_required");
  if(adapter==="ingestPack") return {name:p.name,kind:p.kind,preview_html:p.preview_html,brand_tokens:JSON.stringify(p.brand_tokens),source:p.source,submitted_by_label:p.submitted_by_label};
  if(adapter==="packSync") return {action:"sync",pack:{template_key:"ddv4-"+p.sha256.slice(0,24),name:p.name,pack_type:"web_pack",preview_html:p.preview_html,brand_config:p.brand_tokens,status:"review"}};
  throw new Error("unsupported_adapter");
}
