import { createClientFromRequest } from "../../shared/ownedClient.ts";
import { normalizePhone, isSuppressed, hasConsent, recordConsentEvent } from "../../shared/consentManager.ts";

// ══════════════════════════════════════════════════════════════════
// manageConsent — Public consent management endpoint.
// No auth required: handles web-based opt-out, consent checking,
// and consent recording from public forms.
// ══════════════════════════════════════════════════════════════════

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const action = body.action || "checkConsent";

    // Extract request metadata for audit trail
    const ip_address = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
                       req.headers.get("x-real-ip") || "";
    const user_agent = req.headers.get("user-agent") || "";

    // ── PUBLIC: Check consent status for a phone number ──
    if (action === "checkConsent") {
      const { phone_number } = body;
      if (!phone_number) return Response.json({ error: "phone_number required" }, { status: 400 });

      const normalized = normalizePhone(phone_number);
      const records = await base44.asServiceRole.entities.ConsentLedger.filter(
        { phone_number: normalized },
        { sort: "-created_date", limit: 1 }
      );
      const latest = records.items?.[0];

      return Response.json({
        phone_number: normalized,
        has_consent: (latest?.consent_type === "opt_in" || latest?.consent_type === "re_opt_in") && latest?.status === "active",
        is_suppressed: latest?.consent_type === "opt_out" && latest?.status === "active",
        consent_type: latest?.consent_type || "none",
        status: latest?.status || "none",
        source: latest?.source || "none",
        recorded_at: latest?.created_date || null,
      });
    }

    // ── PUBLIC: Opt out via web form (unsubscribe page) ──
    if (action === "optOut") {
      const { phone_number, email, channel } = body;
      if (!phone_number && !email) {
        return Response.json({ error: "Phone number or email required" }, { status: 400 });
      }

      const record = await recordConsentEvent(base44, {
        phone_number: phone_number || "",
        email: email || "",
        channel: channel || "all",
        consent_type: "opt_out",
        source: "unsubscribe_page",
        ip_address,
        user_agent,
        consent_text_version: "2026-10-06-v1",
      });

      return Response.json({
        success: true,
        message: "You have been unsubscribed from all Strategic Minds AI communications.",
        record_id: record.id,
      });
    }

    // ── PUBLIC: Record opt-in from a web form ──
    if (action === "recordConsent") {
      const { phone_number, email, channel, consent_text_version } = body;
      if (!phone_number && !email) {
        return Response.json({ error: "Phone number or email required" }, { status: 400 });
      }

      const record = await recordConsentEvent(base44, {
        phone_number: phone_number || "",
        email: email || "",
        channel: channel || "all",
        consent_type: "opt_in",
        source: "web_form",
        ip_address,
        user_agent,
        consent_text_version: consent_text_version || "2026-10-06-v1",
      });

      return Response.json({
        success: true,
        message: "Consent recorded. You may now receive messages from Strategic Minds AI.",
        record_id: record.id,
      });
    }

    // ── PUBLIC: Check if a number is suppressed (used by sending functions) ──
    if (action === "isSuppressed") {
      const { phone_number } = body;
      if (!phone_number) return Response.json({ suppressed: false });

      const suppressed = await isSuppressed(base44, phone_number);
      return Response.json({ suppressed });
    }

    return Response.json({ error: "Unknown action" }, { status: 400 });
  } catch (err) {
    console.error("manageConsent error:", err.message || err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}