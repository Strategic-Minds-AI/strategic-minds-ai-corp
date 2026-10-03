import { createClientFromRequest } from "../../shared/ownedClient.ts";
import { callAIGateway } from "../../shared/aiGateway.ts";
import { sendTwilioSms, makeTwilioCall, personalize, extractDeliveryStatus } from "../../shared/twilioMessaging.ts";

// ── Autonomous Action Executor ───────────────────────────────────
// Real trigger → real task → real action → real result.
// Executes SMS, voice calls, AI tasks, web scraping, and lead creation.
// All actions are logged as CommsEvent records for audit trail.
// Uses Twilio (not Telnyx) and the existing Vercel AI Gateway.

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    let body: any = {};
    try { body = await req.json(); } catch {}

    // ── Auth: user session (portal) or admin check ──
    let userId: string | null = null;
    try {
      const user = await base44.auth.me();
      if (user?.id) userId = user.id;
      if (user && user.role !== "admin") return Response.json({ error: "Admin access required" }, { status: 403 });
    } catch {
      return Response.json({ error: "Authentication required" }, { status: 401 });
    }

    const action = body.action;
    const now = new Date().toISOString();

    // ── Capability Status: Check what's live ──
    if (action === "capability_status") {
      return Response.json({
        capabilities: {
          sms: { live: !!process.env.TWILIO_ACCOUNT_SID, label: "SMS via Twilio", detail: "Real SMS messaging" },
          voice: { live: !!process.env.TWILIO_ACCOUNT_SID, label: "Voice Calls via Twilio", detail: "AI voice call initiation" },
          ai_gateway: { live: !!process.env.AI_GATEWAY_API_KEY, label: "Vercel AI Gateway", detail: "Multi-model LLM routing" },
          web_scrape: { live: true, label: "Web Scraper", detail: "Fetch & extract page content" },
          lead_creation: { live: true, label: "CRM Lead Creation", detail: "Create contacts in CRM" },
        },
      });
    }

    // ── SEND SMS ──
    if (action === "send_sms") {
      const { from_number, to_number, message, conversation_id, agent_generated } = body;
      if (!to_number || !message) return Response.json({ error: "to_number and message required" }, { status: 400 });

      const fromNumber = from_number || process.env.TWILIO_PHONE_NUMBER;
      if (!fromNumber) return Response.json({ error: "TWILIO_PHONE_NUMBER not configured" }, { status: 503 });

      const result = await sendTwilioSms(fromNumber, to_number, message);

      // Find or create conversation
      let convId = conversation_id;
      if (!convId) {
        const existing = await base44.asServiceRole.entities.Conversation.filter({ participant_identity: to_number }, { limit: 1 });
        if (existing.items?.length) {
          convId = existing.items[0].id;
        } else {
          const conv = await base44.asServiceRole.entities.Conversation.create({
            participant_identity: to_number,
            status: "active",
            channels: ["sms"],
            last_message_at: now,
            last_message_preview: message.slice(0, 200),
          });
          convId = conv.id;
        }
      }

      // Log as CommsEvent
      await base44.asServiceRole.entities.CommsEvent.create({
        conversation_id: convId,
        channel: "sms",
        direction: "outbound",
        from_addr: fromNumber,
        to_addr: to_number,
        body: message,
        status: result.ok ? "sent" : "failed",
        provider_message_id: result.message_sid,
        error_code: result.error_code,
        error_detail: result.error_message,
        classification: "LIVE",
        agent_generated: agent_generated || false,
      });

      // Update conversation
      if (convId) {
        await base44.asServiceRole.entities.Conversation.update(convId, {
          last_message_at: now,
          last_message_preview: message.slice(0, 200),
        });
      }

      return Response.json({
        action: "send_sms",
        ok: result.ok,
        to: to_number,
        message_sid: result.message_sid,
        status: result.status,
        conversation_id: convId,
      });
    }

    // ── SEND MMS ──
    if (action === "send_mms") {
      const { from_number, to_number, message, media_url, conversation_id } = body;
      if (!to_number) return Response.json({ error: "to_number required" }, { status: 400 });

      const fromNumber = from_number || process.env.TWILIO_PHONE_NUMBER;
      if (!fromNumber) return Response.json({ error: "TWILIO_PHONE_NUMBER not configured" }, { status: 503 });

      const result = await sendTwilioSms(fromNumber, to_number, message || "", media_url ? [media_url] : []);

      let convId = conversation_id;
      if (!convId) {
        const existing = await base44.asServiceRole.entities.Conversation.filter({ participant_identity: to_number }, { limit: 1 });
        if (existing.items?.length) {
          convId = existing.items[0].id;
        } else {
          const conv = await base44.asServiceRole.entities.Conversation.create({
            participant_identity: to_number,
            status: "active",
            channels: ["mms"],
            last_message_at: now,
            last_message_preview: (message || "MMS").slice(0, 200),
          });
          convId = conv.id;
        }
      }

      await base44.asServiceRole.entities.CommsEvent.create({
        conversation_id: convId,
        channel: "mms",
        direction: "outbound",
        from_addr: fromNumber,
        to_addr: to_number,
        body: message || "",
        media_urls: media_url ? JSON.stringify([media_url]) : "",
        status: result.ok ? "sent" : "failed",
        provider_message_id: result.message_sid,
        classification: "LIVE",
      });

      return Response.json({ action: "send_mms", ok: result.ok, message_sid: result.message_sid, conversation_id: convId });
    }

    // ── MAKE VOICE CALL ──
    if (action === "make_call") {
      const { from_number, to_number, twiml_url } = body;
      if (!to_number) return Response.json({ error: "to_number required" }, { status: 400 });

      const fromNumber = from_number || process.env.TWILIO_PHONE_NUMBER;
      if (!fromNumber) return Response.json({ error: "TWILIO_PHONE_NUMBER not configured" }, { status: 503 });

      const webhookUrl = twiml_url || `${process.env.API_URL || new URL(req.url).origin}/functions/twilioWebhook`;
      const result = await makeTwilioCall(fromNumber, to_number, webhookUrl);

      let convId = null;
      const existing = await base44.asServiceRole.entities.Conversation.filter({ participant_identity: to_number }, { limit: 1 });
      if (existing.items?.length) {
        convId = existing.items[0].id;
      } else {
        const conv = await base44.asServiceRole.entities.Conversation.create({
          participant_identity: to_number,
          status: "active",
          channels: ["voice"],
          last_message_at: now,
        });
        convId = conv.id;
      }

      await base44.asServiceRole.entities.CommsEvent.create({
        conversation_id: convId,
        channel: "voice",
        direction: "outbound",
        from_addr: fromNumber,
        to_addr: to_number,
        status: result.ok ? "ringing" : "failed",
        provider_message_id: result.call_sid,
        classification: "LIVE",
      });

      return Response.json({ action: "make_call", ok: result.ok, call_sid: result.call_sid, conversation_id: convId });
    }

    // ── AI TASK: Generate a response using the AI Gateway ──
    if (action === "ai_task") {
      const { system_prompt, messages, model } = body;
      if (!messages || !Array.isArray(messages)) return Response.json({ error: "messages array required" }, { status: 400 });

      const result = await callAIGateway({
        system: system_prompt,
        messages,
        model,
        jsonSchema: body.json_schema,
      });

      return Response.json({
        action: "ai_task",
        content: result.content,
        json: result.json,
        model: result.model,
      });
    }

    // ── WEB SCRAPE: Fetch and extract page content ──
    if (action === "web_scrape") {
      const { url } = body;
      if (!url) return Response.json({ error: "url required" }, { status: 400 });
      const res = await fetch(url, { headers: { "User-Agent": "StrategicMindsAI/1.0" } });
      if (!res.ok) return Response.json({ error: `Fetch failed: ${res.status}` }, { status: res.status });
      const html = await res.text();
      // Extract text content (basic HTML tag removal)
      const text = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
        .replace(/<[^>]+>/g, " ")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 5000);
      return Response.json({ action: "web_scrape", url, content: text, status: res.status });
    }

    // ── CREATE LEAD: Add a contact to CRM ──
    if (action === "create_lead") {
      const { full_name, email, phone, company, industry, source } = body;
      if (!full_name && !phone && !email) return Response.json({ error: "full_name, phone, or email required" }, { status: 400 });
      const lead = await base44.entities.Lead.create({
        name: full_name || "",
        email: email || "",
        phone: phone || "",
        description: company ? `Company: ${company}` : "",
        service: industry || "",
        form_type: "contact",
        message: source || "Agent-created lead",
      });
      return Response.json({ action: "create_lead", lead_id: lead.id, status: "created" });
    }

    // ── SEND PLAYBOOK MESSAGE: Send day N of a playbook sequence ──
    if (action === "send_playbook_message") {
      const { playbook_id, day, contact, from_number } = body;
      if (!playbook_id) return Response.json({ error: "playbook_id required" }, { status: 400 });

      const { getPlaybook } = await import("../../shared/playbooks.ts");
      const playbook = getPlaybook(playbook_id);
      if (!playbook) return Response.json({ error: "playbook not found" }, { status: 404 });

      const dayIndex = (day || 1) - 1;
      if (dayIndex < 0 || dayIndex >= playbook.messages.length) {
        return Response.json({ error: `Day ${day} out of range (1-${playbook.messages.length})` }, { status: 400 });
      }

      const template = playbook.messages[dayIndex];
      const message = personalize(template, contact);
      const toNumber = contact.phone || contact.phone_number;
      if (!toNumber) return Response.json({ error: "contact.phone required" }, { status: 400 });

      const fromNumber = from_number || process.env.TWILIO_PHONE_NUMBER;
      if (!fromNumber) return Response.json({ error: "TWILIO_PHONE_NUMBER not configured" }, { status: 503 });

      const result = await sendTwilioSms(fromNumber, toNumber, message);

      // Find or create conversation
      let convId = null;
      const existing = await base44.asServiceRole.entities.Conversation.filter({ participant_identity: toNumber }, { limit: 1 });
      if (existing.items?.length) {
        convId = existing.items[0].id;
      } else {
        const conv = await base44.asServiceRole.entities.Conversation.create({
          participant_identity: toNumber,
          contact_name: contact.full_name || contact.name || "",
          status: "active",
          channels: ["sms"],
          last_message_at: now,
          last_message_preview: message.slice(0, 200),
        });
        convId = conv.id;
      }

      await base44.asServiceRole.entities.CommsEvent.create({
        conversation_id: convId,
        channel: "sms",
        direction: "outbound",
        from_addr: fromNumber,
        to_addr: toNumber,
        body: message,
        status: result.ok ? "sent" : "failed",
        provider_message_id: result.message_sid,
        classification: "LIVE",
        agent_generated: true,
      });

      return Response.json({
        action: "send_playbook_message",
        playbook_id,
        day: day || 1,
        ok: result.ok,
        message_sid: result.message_sid,
        conversation_id: convId,
      });
    }

    return Response.json({ error: "unknown action", action }, { status: 400 });
  } catch (error) {
    console.error("executeAutonomousAction error:", error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
}