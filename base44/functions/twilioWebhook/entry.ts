import { createClientFromRequest } from "../../shared/ownedClient.ts";
import { callAIGateway } from "../../shared/aiGateway.ts";
import { sendTwilioSms } from "../../shared/twilioMessaging.ts";

// ── Twilio Inbound Webhook Handler ────────────────────────────────
// Receives inbound SMS/MMS and Voice events from Twilio.
// Threads them into Conversation + CommsEvent entities.
// For SMS: generates an AI reply using the AI Gateway and sends it back.
// For Voice: returns TwiML with a greeting and speech gather.

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.clone().text();
    const params = new URLSearchParams(body);
    const form = Object.fromEntries(params.entries());

    // Collect MMS media URLs
    const numMedia = parseInt(form.NumMedia || "0", 10);
    const mediaUrls = [];
    for (let i = 0; i < numMedia; i++) {
      const url = form[`MediaUrl${i}`];
      if (url) mediaUrls.push(url);
    }

    // ── VOICE CALL ──
    if (form.CallSid) {
      const callSid = form.CallSid;
      const fromNumber = form.From || "";
      const toNumber = form.To || "";
      const callStatus = form.CallStatus || "ringing";
      const speechResult = form.SpeechResult || "";
      const gatherUrl = `${process.env.API_URL || new URL(req.url).origin}/functions/twilioWebhook`;

      // New call — create conversation and log event
      if (callStatus === "ringing" || (callStatus === "in-progress" && !speechResult)) {
        let convId = null;
        const existing = await base44.asServiceRole.entities.Conversation.filter({ participant_identity: fromNumber }, { limit: 1 });
        if (existing.items?.length) {
          convId = existing.items[0].id;
        } else {
          const conv = await base44.asServiceRole.entities.Conversation.create({
            participant_identity: fromNumber,
            status: "active",
            channels: ["voice"],
            last_message_at: new Date().toISOString(),
          });
          convId = conv.id;
        }

        await base44.asServiceRole.entities.CommsEvent.create({
          conversation_id: convId,
          channel: "voice",
          direction: "inbound",
          from_addr: fromNumber,
          to_addr: toNumber,
          status: "ringing",
          provider_message_id: callSid,
          classification: "LIVE",
        });

        const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
<Gather input="speech" speechTimeout="auto" action="${gatherUrl}" method="POST">
<Say>Hello, thank you for calling Strategic Minds AI. I'm your AI assistant. How can I help you today?</Say>
</Gather>
</Response>`;
        return new Response(twiml, { headers: { "Content-Type": "text/xml" } });
      }

      // Speech gathered — process with AI
      if (speechResult) {
        let convId = null;
        const existing = await base44.asServiceRole.entities.Conversation.filter({ participant_identity: fromNumber }, { limit: 1 });
        if (existing.items?.length) convId = existing.items[0].id;

        // Log the caller's speech
        await base44.asServiceRole.entities.CommsEvent.create({
          conversation_id: convId,
          channel: "voice",
          direction: "inbound",
          from_addr: fromNumber,
          to_addr: toNumber || "",
          body: speechResult,
          status: "completed",
          provider_message_id: callSid,
          classification: "LIVE",
        });

        // Get conversation history for context
        let history = [];
        if (convId) {
          const events = await base44.asServiceRole.entities.CommsEvent.filter(
            { conversation_id: convId, channel: "voice" },
            { sort: "-created_date", limit: 10 }
          );
          history = (events.items || []).reverse().map(e => ({
            role: e.direction === "inbound" ? "user" : "assistant",
            content: e.body || "",
          }));
        }
        history.push({ role: "user", content: speechResult });

        // Generate AI reply via AI Gateway
        let reply = "I'm sorry, could you repeat that?";
        try {
          const result = await callAIGateway({
            system: "You are the Strategic Minds AI phone assistant. Keep responses conversational and concise — they will be spoken aloud. No emojis. Be professional and helpful. If the caller seems like a lead, capture their name and needs. For complex requests, offer to schedule a callback.",
            messages: history,
            temperature: 0.5,
            maxTokens: 200,
          });
          if (result.content) reply = result.content;
        } catch (e) {
          console.error("AI Gateway error in voice webhook:", e.message);
        }

        // Log the agent's reply
        await base44.asServiceRole.entities.CommsEvent.create({
          conversation_id: convId,
          channel: "voice",
          direction: "outbound",
          from_addr: toNumber || "",
          to_addr: fromNumber,
          body: reply,
          status: "completed",
          provider_message_id: callSid,
          classification: "LIVE",
          agent_generated: true,
        });

        // Check for conversation end
        const endSignals = /goodbye|bye|hang up|that's all|thank you bye|end call/i;
        if (endSignals.test(speechResult)) {
          const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
<Say>${escapeXml(reply)} Have a great day!</Say>
<Hangup/>
</Response>`;
          return new Response(twiml, { headers: { "Content-Type": "text/xml" } });
        }

        const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
<Gather input="speech" speechTimeout="auto" action="${gatherUrl}" method="POST">
<Say>${escapeXml(reply)}</Say>
</Gather>
</Response>`;
        return new Response(twiml, { headers: { "Content-Type": "text/xml" } });
      }

      // Call completed
      if (["completed", "failed", "busy", "no-answer", "canceled"].includes(callStatus)) {
        return new Response("<Response/>", { headers: { "Content-Type": "text/xml" } });
      }

      return new Response("<Response/>", { headers: { "Content-Type": "text/xml" } });
    }

    // ── SMS / MMS ──
    if (form.MessageSid) {
      const fromNumber = form.From || "";
      const toNumber = form.To || "";
      const messageBody = form.Body || "";
      const messageType = numMedia > 0 ? "mms" : "sms";

      // Find or create conversation
      let conversation = null;
      const existing = await base44.asServiceRole.entities.Conversation.filter({ participant_identity: fromNumber }, { limit: 1 });
      if (existing.items?.length) {
        conversation = existing.items[0];
        await base44.asServiceRole.entities.Conversation.update(conversation.id, {
          last_message_preview: messageBody.slice(0, 200),
          last_message_at: new Date().toISOString(),
          unread_count: (conversation.unread_count || 0) + 1,
        });
      } else {
        conversation = await base44.asServiceRole.entities.Conversation.create({
          participant_identity: fromNumber,
          status: "active",
          channels: [messageType],
          last_message_preview: messageBody.slice(0, 200),
          last_message_at: new Date().toISOString(),
          unread_count: 1,
        });
      }

      // Store inbound message
      await base44.asServiceRole.entities.CommsEvent.create({
        conversation_id: conversation.id,
        channel: messageType,
        direction: "inbound",
        from_addr: fromNumber,
        to_addr: toNumber,
        body: messageBody,
        media_urls: mediaUrls.length ? JSON.stringify(mediaUrls) : "",
        status: "delivered",
        provider_message_id: form.MessageSid,
        classification: "LIVE",
      });

      // Check for opt-out keywords
      const optOut = /^(stop|unsubscribe|cancel|end|quit)$/i.test(messageBody.trim());
      if (optOut) {
        await base44.asServiceRole.entities.Conversation.update(conversation.id, { status: "archived" });
        const reply = "You've been unsubscribed. Reply START to resubscribe. — Strategic Minds AI";
        await sendTwilioSms(toNumber, fromNumber, reply);
        await base44.asServiceRole.entities.CommsEvent.create({
          conversation_id: conversation.id,
          channel: "sms",
          direction: "outbound",
          from_addr: toNumber,
          to_addr: fromNumber,
          body: reply,
          status: "sent",
          classification: "LIVE",
          agent_generated: true,
        });
        return new Response("<Response/>", { headers: { "Content-Type": "text/xml" } });
      }

      // Check for HELP keyword
      const helpKeyword = /^help$/i.test(messageBody.trim());
      if (helpKeyword) {
        const reply = "Strategic Minds AI: Reply STOP to unsubscribe, START to resubscribe. For support, call (866) 571-1174 or visit strategicmindsai.com. Msg & data rates may apply.";
        await sendTwilioSms(toNumber, fromNumber, reply);
        await base44.asServiceRole.entities.CommsEvent.create({
          conversation_id: conversation.id,
          channel: "sms",
          direction: "outbound",
          from_addr: toNumber,
          to_addr: fromNumber,
          body: reply,
          status: "sent",
          classification: "LIVE",
          agent_generated: true,
        });
        return new Response("<Response/>", { headers: { "Content-Type": "text/xml" } });
      }

      // Generate AI reply
      let history = [];
      const events = await base44.asServiceRole.entities.CommsEvent.filter(
        { conversation_id: conversation.id },
        { sort: "-created_date", limit: 10 }
      );
      history = (events.items || []).reverse().map(e => ({
        role: e.direction === "inbound" ? "user" : "assistant",
        content: e.body || "",
      }));

      let reply = "Thanks for your message! Our team will follow up shortly. — Strategic Minds AI";
      try {
        const result = await callAIGateway({
          system: "You are the Strategic Minds AI SMS assistant. Keep replies under 320 characters — SMS should be brief and conversational. No emojis. Be professional and helpful. Answer questions about services (business diagnostics, SEO, web development, growth strategy). For complex requests, offer to schedule a callback at (866) 571-1174. If the sender seems like a lead, capture their name and needs.",
          messages: history,
          temperature: 0.5,
          maxTokens: 150,
        });
        if (result.content) reply = result.content.slice(0, 320);
      } catch (e) {
        console.error("AI Gateway error in SMS webhook:", e.message);
      }

      // Send the reply
      const sendResult = await sendTwilioSms(toNumber, fromNumber, reply).catch(err => ({ ok: false, error_message: err.message }));

      await base44.asServiceRole.entities.CommsEvent.create({
        conversation_id: conversation.id,
        channel: "sms",
        direction: "outbound",
        from_addr: toNumber,
        to_addr: fromNumber,
        body: reply,
        status: sendResult.ok ? "sent" : "failed",
        provider_message_id: sendResult.message_sid || "",
        error_detail: sendResult.error_message || "",
        classification: "LIVE",
        agent_generated: true,
      });

      // Update conversation preview
      await base44.asServiceRole.entities.Conversation.update(conversation.id, {
        last_message_preview: reply.slice(0, 200),
        last_message_at: new Date().toISOString(),
      });

      return new Response("<Response/>", { headers: { "Content-Type": "text/xml" } });
    }

    return Response.json({ error: "Unrecognized webhook" }, { status: 400 });
  } catch (error) {
    console.error("twilioWebhook error:", error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

function escapeXml(text) {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
}