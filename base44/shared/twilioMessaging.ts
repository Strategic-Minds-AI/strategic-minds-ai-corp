// ── Twilio Messaging Utilities ──────────────────────────────────
// Shared by executeAutonomousAction, campaign outreach, and follow-up sequences.
// Uses TWILIO_ACCOUNT_SID + TWILIO_AUTH_TOKEN (Basic Auth).

export function personalize(template: string, contact: any): string {
  const firstName = (contact.full_name || contact.name || '').split(' ')[0] || 'there';
  const company = contact.company || 'your company';
  return template
    .replace(/\{\{first_name\}\}/gi, firstName)
    .replace(/\{\{company\}\}/gi, company);
}

async function twilioApi(path: string, method: string, body?: any) {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  if (!sid || !token) throw new Error("TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN not configured");
  const auth = btoa(`${sid}:${token}`);
  const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}${path}`, {
    method,
    headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/x-www-form-urlencoded" },
    body: body ? new URLSearchParams(body).toString() : undefined,
  });
  let data: any = {};
  try { data = await res.json(); } catch {}
  return { ok: res.ok, status: res.status, data };
}

export async function sendTwilioSms(from: string, to: string, message: string, mediaUrls?: string[]) {
  const payload: any = { From: from, To: to, Body: message };
  if (mediaUrls?.length) {
    for (const url of mediaUrls) {
      payload.MediaUrl = url; // Twilio supports multiple MediaUrl params
    }
  }
  const result = await twilioApi("/Messages.json", "POST", payload);
  return {
    ok: result.ok,
    message_sid: result.data?.sid || null,
    status: result.data?.status || (result.ok ? "queued" : "failed"),
    error_code: result.data?.code || null,
    error_message: result.data?.message || null,
  };
}

export async function sendTwilioMms(from: string, to: string, message: string, mediaUrl: string) {
  return sendTwilioSms(from, to, message, [mediaUrl]);
}

export async function makeTwilioCall(from: string, to: string, twimlUrl: string) {
  const payload = { From: from, To: to, Url: twimlUrl };
  const result = await twilioApi("/Calls.json", "POST", payload);
  return {
    ok: result.ok,
    call_sid: result.data?.sid || null,
    status: result.data?.status || (result.ok ? "queued" : "failed"),
    error_message: result.data?.message || null,
  };
}

export function extractDeliveryStatus(data: any): { delivered: boolean; status: string; error_code: string | null; error_detail: string | null } {
  const status = data?.status || "unknown";
  const errorCode = data?.error_code || data?.code || null;
  const errorDetail = data?.error_message || data?.message || null;
  return {
    delivered: status === "delivered" || status === "sent",
    status,
    error_code: errorCode,
    error_detail: errorDetail,
  };
}