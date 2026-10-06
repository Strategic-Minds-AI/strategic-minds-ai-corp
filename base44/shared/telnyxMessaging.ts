// ── Telnyx Messaging & Voice Utilities ─────────────────────────────
// Telnyx API helpers for SMS, WhatsApp, and voice calls.
// Uses TELNYX_API_KEY (Bearer auth). Secondary provider alongside Twilio.

const TELNYX_BASE = "https://api.telnyx.com/v2";

export async function sendTelnyxSms(from: string, to: string, body: string) {
  const apiKey = process.env.TELNYX_API_KEY;
  if (!apiKey) throw new Error("TELNYX_API_KEY not configured");
  const res = await fetch(`${TELNYX_BASE}/messages`, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from,
      to,
      text: body,
      messaging_profile_id: undefined,
    }),
  });
  let data: any = {};
  try { data = await res.json(); } catch {}
  return {
    ok: res.ok,
    message_id: data.data?.id || null,
    status: data.data?.status || (res.ok ? "queued" : "failed"),
    error_message: data.errors?.[0]?.detail || data.error?.message || null,
  };
}

export async function sendTelnyxWhatsApp(from: string, to: string, body: string) {
  const apiKey = process.env.TELNYX_API_KEY;
  if (!apiKey) throw new Error("TELNYX_API_KEY not configured");
  const res = await fetch(`${TELNYX_BASE}/messages`, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from,
      to,
      text: body,
      type: "WhatsApp",
    }),
  });
  let data: any = {};
  try { data = await res.json(); } catch {}
  return {
    ok: res.ok,
    message_id: data.data?.id || null,
    status: data.data?.status || (res.ok ? "queued" : "failed"),
    error_message: data.errors?.[0]?.detail || data.error?.message || null,
  };
}

export async function makeTelnyxCall(from: string, to: string, webhookUrl: string) {
  const apiKey = process.env.TELNYX_API_KEY;
  if (!apiKey) throw new Error("TELNYX_API_KEY not configured");
  const res = await fetch(`${TELNYX_BASE}/calls`, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from,
      to,
      webhook_url: webhookUrl,
    }),
  });
  let data: any = {};
  try { data = await res.json(); } catch {}
  return {
    ok: res.ok,
    call_id: data.data?.id || null,
    status: data.data?.call_status || (res.ok ? "queued" : "failed"),
    error_message: data.errors?.[0]?.detail || data.error?.message || null,
  };
}