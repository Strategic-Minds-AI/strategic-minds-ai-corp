// ══════════════════════════════════════════════════════════════════
// Consent Manager — shared helpers for the ConsentLedger entity.
// Used by twilioWebhook, edenSkye, and manageConsent backend functions.
// ══════════════════════════════════════════════════════════════════

/**
 * Normalize a phone number to E.164 format (+1XXXXXXXXXX for US).
 */
export function normalizePhone(phone: string): string {
  if (!phone) return "";
  let cleaned = String(phone).replace(/[^\d+]/g, "");
  if (cleaned.startsWith("+")) return cleaned;
  if (cleaned.length === 11 && cleaned.startsWith("1")) return "+" + cleaned;
  if (cleaned.length === 10) return "+1" + cleaned;
  return "+" + cleaned;
}

/**
 * Check if a phone number has an active opt-out (suppressed across all channels).
 * Returns true if the most recent active consent event for this number is an opt-out.
 */
export async function isSuppressed(base44, phone: string): Promise<boolean> {
  if (!phone) return false;
  const normalized = normalizePhone(phone);
  const records = await base44.asServiceRole.entities.ConsentLedger.filter(
    { phone_number: normalized, status: "active" },
    { sort: "-created_date", limit: 1 }
  );
  const latest = records.items?.[0];
  return latest?.consent_type === "opt_out";
}

/**
 * Check if a phone number has an active opt-in (consented to receive messages).
 */
export async function hasConsent(base44, phone: string): Promise<boolean> {
  if (!phone) return false;
  const normalized = normalizePhone(phone);
  const records = await base44.asServiceRole.entities.ConsentLedger.filter(
    { phone_number: normalized, status: "active" },
    { sort: "-created_date", limit: 1 }
  );
  const latest = records.items?.[0];
  return latest?.consent_type === "opt_in" || latest?.consent_type === "re_opt_in";
}

/**
 * Record a consent event in the ledger.
 */
export async function recordConsentEvent(base44, params: {
  phone_number?: string;
  email?: string;
  channel?: string;
  consent_type: string;
  source: string;
  keyword_used?: string;
  provider_message_id?: string;
  consent_text_version?: string;
  ip_address?: string;
  user_agent?: string;
  notes?: string;
}) {
  return await base44.asServiceRole.entities.ConsentLedger.create({
    phone_number: params.phone_number ? normalizePhone(params.phone_number) : "",
    email: params.email || "",
    channel: params.channel || "all",
    consent_type: params.consent_type,
    source: params.source,
    keyword_used: params.keyword_used || "",
    provider_message_id: params.provider_message_id || "",
    consent_text_version: params.consent_text_version || "",
    ip_address: params.ip_address || "",
    user_agent: params.user_agent || "",
    status: "active",
    notes: params.notes || "",
  });
}