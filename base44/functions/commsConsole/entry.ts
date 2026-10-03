import { createClientFromRequest } from "../../shared/ownedClient.ts";
import { sendTwilioSms, personalize } from "../../shared/twilioMessaging.ts";
import { getPlaybook, listPlaybooks } from "../../shared/playbooks.ts";

// ── Communications Console ────────────────────────────────────────
// Admin function for the comms inbox: list conversations, get messages,
// send outbound SMS, provision agents, and manage campaigns.

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
    if (user.role !== "admin") return Response.json({ error: "Forbidden" }, { status: 403 });

    const payload = await req.json();
    const action = payload.action || "list";

    // ── List conversations ──
    if (action === "list") {
      const conversations = await base44.entities.Conversation.filter(
        {},
        { sort: "-last_message_at", limit: 50 }
      );
      return Response.json({ conversations: conversations.items || [] });
    }

    // ── Get messages for a conversation ──
    if (action === "messages") {
      const { conversation_id } = payload;
      if (!conversation_id) return Response.json({ error: "conversation_id required" }, { status: 400 });
      const messages = await base44.entities.CommsEvent.filter(
        { conversation_id },
        { sort: "created_date", limit: 200 }
      );
      // Mark conversation as read
      await base44.entities.Conversation.update(conversation_id, { unread_count: 0 });
      return Response.json({ messages: messages.items || [] });
    }

    // ── Send outbound SMS ──
    if (action === "send") {
      const { to, body, from_number } = payload;
      if (!to || !body) return Response.json({ error: "to and body required" }, { status: 400 });

      const fromNumber = from_number || process.env.TWILIO_PHONE_NUMBER;
      if (!fromNumber) return Response.json({ error: "TWILIO_PHONE_NUMBER not configured" }, { status: 503 });

      const result = await sendTwilioSms(fromNumber, to, body);

      // Find or create conversation
      let convId = null;
      const existing = await base44.asServiceRole.entities.Conversation.filter({ participant_identity: to }, { limit: 1 });
      if (existing.items?.length) {
        convId = existing.items[0].id;
      } else {
        const conv = await base44.asServiceRole.entities.Conversation.create({
          participant_identity: to,
          status: "active",
          channels: ["sms"],
          last_message_at: new Date().toISOString(),
          last_message_preview: body.slice(0, 200),
        });
        convId = conv.id;
      }

      await base44.asServiceRole.entities.CommsEvent.create({
        conversation_id: convId,
        channel: "sms",
        direction: "outbound",
        from_addr: fromNumber,
        to_addr: to,
        body,
        status: result.ok ? "sent" : "failed",
        provider_message_id: result.message_sid || "",
        error_detail: result.error_message || "",
        classification: "LIVE",
      });

      await base44.asServiceRole.entities.Conversation.update(convId, {
        last_message_preview: body.slice(0, 200),
        last_message_at: new Date().toISOString(),
      });

      return Response.json({ success: true, message_sid: result.message_sid, conversation_id: convId });
    }

    // ── Update conversation ──
    if (action === "updateConversation") {
      const { conversation_id, contact_name, status, assigned_agent_id } = payload;
      const updates = {};
      if (contact_name !== undefined) updates.contact_name = contact_name;
      if (status !== undefined) updates.status = status;
      if (assigned_agent_id !== undefined) updates.assigned_agent_id = assigned_agent_id;
      await base44.entities.Conversation.update(conversation_id, updates);
      return Response.json({ success: true });
    }

    // ── List agent personas ──
    if (action === "listAgents") {
      const agents = await base44.entities.AgentPersona.filter(
        {},
        { sort: "-created_date", limit: 50 }
      );
      return Response.json({ agents: agents.items || [] });
    }

    // ── Create agent persona ──
    if (action === "createAgent") {
      const { name, agent_tier, system_prompt, tone, assigned_number, target_industry, capabilities, playbook_id } = payload;
      if (!name) return Response.json({ error: "name required" }, { status: 400 });

      const tierDefaults = {
        standard: { capabilities: ["sms"], power_level: 1, autonomy: "supervised" },
        super: { capabilities: ["sms", "mms", "voice", "whatsapp", "web_interact", "api_access"], power_level: 7, autonomy: "autonomous" },
        swarm: { capabilities: ["sms", "voice", "web_interact"], power_level: 5, autonomy: "autonomous" },
        fulfillment: { capabilities: ["sms", "mms", "voice", "web_interact", "api_access"], power_level: 6, autonomy: "autonomous" },
        shadow: { capabilities: ["sms", "voice", "web_interact", "api_access", "shadow_mode"], power_level: 9, autonomy: "fully_autonomous" },
      };
      const defaults = tierDefaults[agent_tier] || tierDefaults.standard;

      const agent = await base44.entities.AgentPersona.create({
        name,
        persona_type: agent_tier === "super" ? "super" : agent_tier === "shadow" ? "shadow" : "voice",
        agent_tier: agent_tier || "standard",
        system_prompt: system_prompt || "",
        tone: tone || "professional",
        assigned_number: assigned_number || "",
        target_industry: target_industry || "",
        capabilities: capabilities || defaults.capabilities,
        playbook_id: playbook_id || "",
        power_level: defaults.power_level,
        autonomy_level: defaults.autonomy,
        avatar_color: "#0066FF",
        status: "active",
        provisioned_at: new Date().toISOString(),
      });

      // If a playbook is assigned, create the 15 CommunicationTemplate records
      if (playbook_id) {
        const playbook = getPlaybook(playbook_id);
        if (playbook) {
          const templates = [];
          for (let day = 0; day < playbook.messages.length; day++) {
            const tpl = await base44.asServiceRole.entities.CommunicationTemplate.create({
              industry: playbook.target_industry || "universal",
              channel: "sms",
              situation: day === 0 ? "outreach" : day < 5 ? "follow_up" : day < 10 ? "nurture" : "re_engagement",
              tone: tone || "consultative",
              persona_id: agent.id,
              template_body: playbook.messages[day],
              target_audience: `${playbook.target_industry} businesses`,
              active: true,
              sequence_day: day + 1,
              playbook_id: playbook.id,
              effectiveness_score: 85,
            });
            templates.push(tpl.id);
          }
          return Response.json({ agent_id: agent.id, templates_created: templates.length });
        }
      }

      return Response.json({ agent_id: agent.id, status: "created" });
    }

    // ── List playbooks ──
    if (action === "listPlaybooks") {
      return Response.json({ playbooks: listPlaybooks() });
    }

    // ── List campaigns ──
    if (action === "listCampaigns") {
      const campaigns = await base44.entities.Campaign.filter(
        {},
        { sort: "-created_date", limit: 50 }
      );
      return Response.json({ campaigns: campaigns.items || [] });
    }

    // ── Create campaign ──
    if (action === "createCampaign") {
      const { name, channel, message_template, persona_id, throttle_per_sec } = payload;
      if (!name) return Response.json({ error: "name required" }, { status: 400 });
      const campaign = await base44.entities.Campaign.create({
        name,
        channel: channel || "sms",
        message_template: message_template || "",
        persona_id: persona_id || "",
        throttle_per_sec: throttle_per_sec || 10,
        status: "draft",
      });
      return Response.json({ campaign_id: campaign.id });
    }

    // ── Capability status ──
    if (action === "status") {
      return Response.json({
        sms: !!process.env.TWILIO_ACCOUNT_SID,
        voice: !!process.env.TWILIO_ACCOUNT_SID,
        ai_gateway: !!process.env.AI_GATEWAY_API_KEY,
        phone_number: process.env.TWILIO_PHONE_NUMBER || null,
      });
    }

    return Response.json({ error: "Unknown action" }, { status: 400 });
  } catch (error) {
    console.error("commsConsole error:", error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
}