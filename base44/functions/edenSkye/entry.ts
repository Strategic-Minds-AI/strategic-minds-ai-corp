import { createClientFromRequest } from "../../shared/ownedClient.ts";
import { callAIGateway } from "../../shared/aiGateway.ts";
import { sendTwilioSms, makeTwilioCall } from "../../shared/twilioMessaging.ts";
import { sendTelnyxSms, sendTelnyxWhatsApp, makeTelnyxCall } from "../../shared/telnyxMessaging.ts";
import { EDEN_SYSTEM_PROMPT, EDEN_GREETING, EDEN_VOICEMAIL_GREETING, EDEN_VOICE } from "../../shared/edenSkyePersona.ts";

// ── Eden Skye: AI Executive Assistant Backend ──────────────────────
// Handles voice calls (Twilio), SMS/MMS (Twilio + Telnyx), WhatsApp,
// email (Gmail connector), calendar (Google Calendar connector),
// task management, and a direct chat interface.

function escapeXml(text) {
  return String(text || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
}

function twimlSay(text, voice = EDEN_VOICE) {
  return `<Say voice="${voice}">${escapeXml(text)}</Say>`;
}

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const contentType = req.headers.get("content-type") || "";
    let body = {};

    // Twilio sends form-encoded data; frontend sends JSON
    if (contentType.includes("application/x-www-form-urlencoded")) {
      const text = await req.clone().text();
      const params = new URLSearchParams(text);
      body = Object.fromEntries(params.entries());
    } else {
      body = await req.json().catch(() => ({}));
    }

    // ── WEBHOOK ENTRY POINTS (no auth — validated by provider) ──
    // Twilio voice webhook: incoming call or speech gather
    if (body.CallSid) {
      return handleTwilioVoice(req, base44, body);
    }

    const action = body.action || "status";

    // ── AUTHENTICATED ACTIONS ──
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
    if (user.role !== "admin") return Response.json({ error: "Admin access required" }, { status: 403 });

    switch (action) {
      case "status": return await getStatus(base44);
      case "dashboard": return await getDashboard(base44);
      case "listConversations": return await listConversations(base44, body);
      case "getMessages": return await getMessages(base44, body);
      case "sendSms": return await sendSms(base44, body);
      case "sendWhatsApp": return await sendWhatsAppMsg(base44, body);
      case "makeCall": return await makeCall(base44, body);
      case "listCalls": return await listCalls(base44, body);
      case "listCalendar": return await listCalendar(base44);
      case "createAppointment": return await createAppointment(base44, body);
      case "checkAvailability": return await checkAvailability(base44, body);
      case "findSlots": return await findSlots(base44, body);
      case "listEmails": return await listEmails(base44, body);
      case "readEmail": return await readEmail(base44, body);
      case "sendEmail": return await sendEmail(base44, body);
      case "draftEmailReply": return await draftEmailReply(base44, body);
      case "cleanInbox": return await cleanInbox(base44, body);
      case "listTasks": return await listTasks(base44, body);
      case "createTask": return await createTask(base44, body);
      case "updateTask": return await updateTask(base44, body);
      case "chat": return await chat(base44, body);
      case "getChatHistory": return await getChatHistory(base44, body);
      default: return Response.json({ error: "Unknown action" }, { status: 400 });
    }
  } catch (error) {
    console.error("edenSkye error:", error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

// ══════════════════════════════════════════════════════════════════
// VOICE CALL HANDLING (Twilio TwiML)
// ══════════════════════════════════════════════════════════════════

async function handleTwilioVoice(req, base44, body) {
  const fromNumber = body.From || "";
  const toNumber = body.To || "";
  const callStatus = body.CallStatus || "ringing";
  const speechResult = body.SpeechResult || "";
  const callSid = body.CallSid || "";
  const webhookUrl = `${process.env.API_URL || new URL(req.url).origin}/functions/edenSkye`;

  // New incoming call — greet with Eden's voice
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

    await base44.asServiceRole.entities.CallLog.create({
      call_sid: callSid,
      from_number: fromNumber,
      to_number: toNumber,
      direction: "inbound",
      status: "ringing",
      started_at: new Date().toISOString(),
    });

    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
<Gather input="speech" speechTimeout="auto" action="${webhookUrl}" method="POST" bargeIn="true">
${twimlSay(EDEN_GREETING)}
</Gather>
</Response>`;
    return new Response(twiml, { headers: { "Content-Type": "text/xml" } });
  }

  // Speech gathered — process with Eden's AI
  if (speechResult) {
    let convId = null;
    const existing = await base44.asServiceRole.entities.Conversation.filter({ participant_identity: fromNumber }, { limit: 1 });
    if (existing.items?.length) convId = existing.items[0].id;

    await base44.asServiceRole.entities.CommsEvent.create({
      conversation_id: convId,
      channel: "voice",
      direction: "inbound",
      from_addr: fromNumber,
      to_addr: toNumber,
      body: speechResult,
      status: "completed",
      provider_message_id: callSid,
      classification: "LIVE",
    });

    // Get conversation history
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

    // Get calendar availability for context
    let calendarContext = "";
    try {
      const { accessToken } = await base44.asServiceRole.connectors.getConnection("googlecalendar");
      const now = new Date();
      const end = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      const calRes = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${encodeURIComponent(now.toISOString())}&timeMax=${encodeURIComponent(end.toISOString())}&maxResults=20&singleEvents=true&orderBy=startTime`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (calRes.ok) {
        const calData = await calRes.json();
        const busy = (calData.items || []).map(e => `${e.start?.dateTime || e.start?.date} - ${e.summary || "busy"}`).join("; ");
        if (busy) calendarContext = `\n\nJeremy's calendar for the next 7 days (busy times): ${busy}`;
      }
    } catch (e) { /* calendar optional */ }

    // Generate Eden's reply
    let reply = "I'm sorry, could you say that again?";
    try {
      const result = await callAIGateway({
        system: EDEN_SYSTEM_PROMPT + calendarContext,
        messages: history,
        temperature: 0.7,
        maxTokens: 200,
      });
      if (result.content) reply = result.content;
    } catch (e) {
      console.error("Eden voice AI error:", e.message);
    }

    await base44.asServiceRole.entities.CommsEvent.create({
      conversation_id: convId,
      channel: "voice",
      direction: "outbound",
      from_addr: toNumber,
      to_addr: fromNumber,
      body: reply,
      status: "completed",
      provider_message_id: callSid,
      classification: "LIVE",
      agent_generated: true,
    });

    // Check for call end
    const endSignals = /goodbye|bye|hang up|that's all|thank you bye|end call|see you|talk later/i;
    if (endSignals.test(speechResult)) {
      const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
${twimlSay(reply + " Have a wonderful day!")}
<Hangup/>
</Response>`;
      // Update call log
      await updateCallLog(base44, callSid, "completed", speechResult, reply);
      return new Response(twiml, { headers: { "Content-Type": "text/xml" } });
    }

    // Check if Eden should create a task (callback, appointment, etc.)
    if (/schedule|book|appointment|callback|call (me|him) back|set up a (time|meeting)|meet/i.test(speechResult)) {
      try {
        await base44.asServiceRole.entities.EdenSkyeTask.create({
          title: `Callback/appointment for ${fromNumber}`,
          description: `Caller requested scheduling. Original request: "${speechResult.slice(0, 500)}". Eden responded: "${reply.slice(0, 300)}"`,
          category: "appointment",
          priority: "high",
          status: "pending",
          related_phone: fromNumber,
          related_conversation_id: convId || "",
          source: "voice_call",
          ai_summary: "Caller requested scheduling during a voice call. Eden should follow up to confirm a time.",
        });
      } catch (e) { /* task creation optional */ }
    }

    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
<Gather input="speech" speechTimeout="auto" action="${webhookUrl}" method="POST" bargeIn="true">
${twimlSay(reply)}
</Gather>
</Response>`;
    return new Response(twiml, { headers: { "Content-Type": "text/xml" } });
  }

  // Call completed
  if (["completed", "failed", "busy", "no-answer", "canceled"].includes(callStatus)) {
    await updateCallLog(base44, callSid, callStatus, "", "");
    return new Response("<Response/>", { headers: { "Content-Type": "text/xml" } });
  }

  return new Response("<Response/>", { headers: { "Content-Type": "text/xml" } });
}

async function updateCallLog(base44, callSid, status, lastInput, lastReply) {
  try {
    const logs = await base44.asServiceRole.entities.CallLog.filter({ call_sid: callSid }, { limit: 1 });
    if (logs.items?.length) {
      const log = logs.items[0];
      const transcript = log.transcript ? JSON.parse(log.transcript) : [];
      if (lastInput) transcript.push({ role: "caller", text: lastInput });
      if (lastReply) transcript.push({ role: "eden", text: lastReply });
      await base44.asServiceRole.entities.CallLog.update(log.id, {
        status,
        ended_at: new Date().toISOString(),
        transcript: JSON.stringify(transcript).slice(0, 20000),
      });
    }
  } catch (e) { /* optional */ }
}

// ══════════════════════════════════════════════════════════════════
// STATUS & DASHBOARD
// ══════════════════════════════════════════════════════════════════

async function getStatus(base44) {
  return Response.json({
    online: true,
    name: "Eden Skye",
    role: "AI Executive Assistant",
    voice: EDEN_VOICE,
    twilio: !!process.env.TWILIO_ACCOUNT_SID,
    telnyx: !!process.env.TELNYX_API_KEY,
    ai_gateway: !!process.env.AI_GATEWAY_API_KEY,
    phone_number: process.env.TWILIO_PHONE_NUMBER || null,
    telnyx_number: process.env.TELNYX_PHONE_NUMBER || null,
  });
}

async function getDashboard(base44) {
  const now = new Date();
  const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();

  const [calls, messages, tasks, conversations] = await Promise.all([
    base44.entities.CallLog.filter({}, { sort: "-created_date", limit: 10 }),
    base44.entities.CommsEvent.filter({ channel: { $in: ["sms", "mms", "whatsapp"] } }, { sort: "-created_date", limit: 10 }),
    base44.entities.EdenSkyeTask.filter({ status: { $in: ["pending", "in_progress"] } }, { sort: "-created_date", limit: 10 }),
    base44.entities.Conversation.filter({ status: "active" }, { sort: "-last_message_at", limit: 10 }),
  ]);

  const callCount = await base44.entities.CallLog.count({});
  const msgCount = await base44.entities.CommsEvent.count({ channel: { $in: ["sms", "mms", "whatsapp"] } });
  const taskCount = await base44.entities.EdenSkyeTask.count({ status: "pending" });
  const unreadCount = await base44.entities.Conversation.count({ status: "active", unread_count: { $gt: 0 } });

  return Response.json({
    stats: { calls: callCount, messages: msgCount, tasks: taskCount, unread: unreadCount },
    recentCalls: calls.items || [],
    recentMessages: messages.items || [],
    pendingTasks: tasks.items || [],
    activeConversations: conversations.items || [],
  });
}

// ══════════════════════════════════════════════════════════════════
// MESSAGING (SMS, MMS, WhatsApp)
// ══════════════════════════════════════════════════════════════════

async function listConversations(base44, body) {
  const conversations = await base44.entities.Conversation.filter(
    { status: { $ne: "archived" } },
    { sort: "-last_message_at", limit: 50 }
  );
  return Response.json({ conversations: conversations.items || [] });
}

async function getMessages(base44, body) {
  const { conversation_id } = body;
  if (!conversation_id) return Response.json({ error: "conversation_id required" }, { status: 400 });
  const messages = await base44.entities.CommsEvent.filter(
    { conversation_id },
    { sort: "created_date", limit: 200 }
  );
  await base44.entities.Conversation.update(conversation_id, { unread_count: 0 });
  return Response.json({ messages: messages.items || [] });
}

async function sendSms(base44, body) {
  const { to, message, provider, mediaUrl } = body;
  if (!to || !message) return Response.json({ error: "to and message required" }, { status: 400 });

  const fromNumber = process.env.TWILIO_PHONE_NUMBER;
  if (!fromNumber && provider !== "telnyx") return Response.json({ error: "TWILIO_PHONE_NUMBER not configured" }, { status: 503 });

  let result;
  if (provider === "telnyx" || (!fromNumber && process.env.TELNYX_API_KEY)) {
    const telnyxFrom = process.env.TELNYX_PHONE_NUMBER;
    if (!telnyxFrom) return Response.json({ error: "TELNYX_PHONE_NUMBER not configured" }, { status: 503 });
    result = await sendTelnyxSms(telnyxFrom, to, message);
  } else {
    result = await sendTwilioSms(fromNumber, to, message, mediaUrl ? [mediaUrl] : undefined);
  }

  // Log to conversation
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
      last_message_preview: message.slice(0, 200),
    });
    convId = conv.id;
  }

  await base44.asServiceRole.entities.CommsEvent.create({
    conversation_id: convId,
    channel: mediaUrl ? "mms" : "sms",
    direction: "outbound",
    from_addr: fromNumber || process.env.TELNYX_PHONE_NUMBER,
    to_addr: to,
    body: message,
    status: result.ok ? "sent" : "failed",
    provider_message_id: result.message_sid || result.message_id || "",
    error_detail: result.error_message || "",
    classification: "LIVE",
    agent_generated: true,
  });

  await base44.asServiceRole.entities.Conversation.update(convId, {
    last_message_preview: message.slice(0, 200),
    last_message_at: new Date().toISOString(),
  });

  return Response.json({ success: result.ok, message_id: result.message_sid || result.message_id, error: result.error_message });
}

async function sendWhatsAppMsg(base44, body) {
  const { to, message } = body;
  if (!to || !message) return Response.json({ error: "to and message required" }, { status: 400 });

  const fromNumber = process.env.TELNYX_PHONE_NUMBER;
  if (!fromNumber) return Response.json({ error: "TELNYX_PHONE_NUMBER required for WhatsApp" }, { status: 503 });

  const result = await sendTelnyxWhatsApp(fromNumber, to, message);

  let convId = null;
  const existing = await base44.asServiceRole.entities.Conversation.filter({ participant_identity: to }, { limit: 1 });
  if (existing.items?.length) {
    convId = existing.items[0].id;
  } else {
    const conv = await base44.asServiceRole.entities.Conversation.create({
      participant_identity: to,
      status: "active",
      channels: ["whatsapp"],
      last_message_at: new Date().toISOString(),
      last_message_preview: message.slice(0, 200),
    });
    convId = conv.id;
  }

  await base44.asServiceRole.entities.CommsEvent.create({
    conversation_id: convId,
    channel: "whatsapp",
    direction: "outbound",
    from_addr: fromNumber,
    to_addr: to,
    body: message,
    status: result.ok ? "sent" : "failed",
    provider_message_id: result.message_id || "",
    error_detail: result.error_message || "",
    classification: "LIVE",
    agent_generated: true,
  });

  await base44.asServiceRole.entities.Conversation.update(convId, {
    last_message_preview: message.slice(0, 200),
    last_message_at: new Date().toISOString(),
  });

  return Response.json({ success: result.ok, message_id: result.message_id, error: result.error_message });
}

// ══════════════════════════════════════════════════════════════════
// CALLS
// ══════════════════════════════════════════════════════════════════

async function makeCall(base44, body) {
  const { to, provider } = body;
  if (!to) return Response.json({ error: "to required" }, { status: 400 });

  const webhookUrl = `${process.env.API_URL || ""}/functions/edenSkye`;
  const fromNumber = process.env.TWILIO_PHONE_NUMBER;
  let result;

  if (provider === "telnyx" || (!fromNumber && process.env.TELNYX_API_KEY)) {
    const telnyxFrom = process.env.TELNYX_PHONE_NUMBER;
    if (!telnyxFrom) return Response.json({ error: "TELNYX_PHONE_NUMBER not configured" }, { status: 503 });
    result = await makeTelnyxCall(telnyxFrom, to, webhookUrl);
  } else {
    result = await makeTwilioCall(fromNumber, to, webhookUrl);
  }

  await base44.asServiceRole.entities.CallLog.create({
    call_sid: result.call_sid || result.call_id || "outbound",
    from_number: fromNumber || process.env.TELNYX_PHONE_NUMBER,
    to_number: to,
    direction: "outbound",
    status: result.ok ? "ringing" : "failed",
    started_at: new Date().toISOString(),
  });

  return Response.json({ success: result.ok, call_id: result.call_sid || result.call_id, error: result.error_message });
}

async function listCalls(base44, body) {
  const calls = await base44.entities.CallLog.filter(
    {},
    { sort: "-created_date", limit: body.limit || 50 }
  );
  return Response.json({ calls: calls.items || [] });
}

// ══════════════════════════════════════════════════════════════════
// CALENDAR (Google Calendar connector)
// ══════════════════════════════════════════════════════════════════

async function listCalendar(base44) {
  try {
    const { accessToken } = await base44.asServiceRole.connectors.getConnection("googlecalendar");
    const now = new Date();
    const end = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const res = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${encodeURIComponent(now.toISOString())}&timeMax=${encodeURIComponent(end.toISOString())}&maxResults=50&singleEvents=true&orderBy=startTime`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error?.message || "Calendar request failed");
    return Response.json({ events: (data.items || []).map(e => ({
      id: e.id,
      title: e.summary || "(no title)",
      start: e.start?.dateTime || e.start?.date,
      end: e.end?.dateTime || e.end?.date,
      location: e.location || "",
      attendees: (e.attendees || []).map(a => a.email),
      htmlLink: e.htmlLink,
    })) });
  } catch (error) {
    return Response.json({ error: error.message, events: [] }, { status: 500 });
  }
}

async function createAppointment(base44, body) {
  const { title, start, end, attendees, description, location } = body;
  if (!title || !start) return Response.json({ error: "title and start required" }, { status: 400 });

  try {
    const { accessToken } = await base44.asServiceRole.connectors.getConnection("googlecalendar");
    const startDate = new Date(start);
    const endDate = end ? new Date(end) : new Date(startDate.getTime() + 30 * 60 * 1000);

    const eventBody = {
      summary: title,
      description: description || `Scheduled by Eden Skye — Strategic Minds AI`,
      start: { dateTime: startDate.toISOString() },
      end: { dateTime: endDate.toISOString() },
      ...(location ? { location } : {}),
      ...(attendees?.length ? { attendees: attendees.map(a => ({ email: a })) } : {}),
    };

    const res = await fetch("https://www.googleapis.com/calendar/v3/calendars/primary/events?sendUpdates=all", {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
      body: JSON.stringify(eventBody),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error?.message || "Failed to create event");

    await base44.asServiceRole.entities.EdenSkyeTask.create({
      title: `Appointment: ${title}`,
      description: `Calendar event created. Start: ${startDate.toISOString()}. Attendees: ${(attendees || []).join(", ")}`,
      category: "appointment",
      priority: "high",
      status: "completed",
      completed_at: new Date().toISOString(),
      source: "calendar",
      ai_summary: "Eden scheduled this appointment on Google Calendar.",
    });

    return Response.json({ success: true, event_id: data.id, htmlLink: data.htmlLink });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

async function checkAvailability(base44, body) {
  const { date } = body;
  if (!date) return Response.json({ error: "date required (ISO string)" }, { status: 400 });

  try {
    const { accessToken } = await base44.asServiceRole.connectors.getConnection("googlecalendar");
    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(dayStart);
    dayEnd.setHours(23, 59, 59, 999);

    const res = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${encodeURIComponent(dayStart.toISOString())}&timeMax=${encodeURIComponent(dayEnd.toISOString())}&maxResults=50&singleEvents=true&orderBy=startTime`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error?.message || "Calendar request failed");

    return Response.json({ busy: (data.items || []).map(e => ({
      start: e.start?.dateTime || e.start?.date,
      end: e.end?.dateTime || e.end?.date,
      title: e.summary,
    })) });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

async function findSlots(base44, body) {
  const { date, durationMinutes = 30 } = body;
  if (!date) return Response.json({ error: "date required" }, { status: 400 });

  try {
    const { accessToken } = await base44.asServiceRole.connectors.getConnection("googlecalendar");
    const dayStart = new Date(date);
    dayStart.setHours(9, 0, 0, 0);
    const dayEnd = new Date(dayStart);
    dayEnd.setHours(17, 0, 0, 0);

    const res = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${encodeURIComponent(dayStart.toISOString())}&timeMax=${encodeURIComponent(dayEnd.toISOString())}&maxResults=50&singleEvents=true&orderBy=startTime`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error?.message || "Calendar request failed");

    // Calculate free slots
    const busy = (data.items || []).map(e => ({
      start: new Date(e.start?.dateTime || e.start?.date),
      end: new Date(e.end?.dateTime || e.end?.date),
    }));

    const slots = [];
    let cursor = new Date(dayStart);
    const dur = durationMinutes * 60 * 1000;
    while (cursor.getTime() + dur <= dayEnd.getTime()) {
      const slotEnd = new Date(cursor.getTime() + dur);
      const isFree = !busy.some(b => cursor < b.end && slotEnd > b.start);
      if (isFree) slots.push({ start: cursor.toISOString(), end: slotEnd.toISOString() });
      cursor = new Date(cursor.getTime() + 30 * 60 * 1000); // 30-min increments
    }

    return Response.json({ slots: slots.slice(0, 10) });
  } catch (error) {
    return Response.json({ error: error.message, slots: [] }, { status: 500 });
  }
}

// ══════════════════════════════════════════════════════════════════
// EMAIL (Gmail connector)
// ══════════════════════════════════════════════════════════════════

async function listEmails(base44, body) {
  const { max = 20, query = "in:inbox" } = body;
  try {
    const { accessToken } = await base44.asServiceRole.connectors.getConnection("gmail");
    const res = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${encodeURIComponent(query)}&maxResults=${max}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error?.message || "Gmail request failed");

    const messages = await Promise.all((data.messages || []).slice(0, max).map(async (m) => {
      const detail = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${m.id}?format=metadata&metadataHeaders=From&metadataHeaders=Subject&metadataHeaders=Date`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const d = await detail.json();
      const headers = d.payload?.headers || [];
      const get = (name) => headers.find(h => h.name === name)?.value || "";
      return {
        id: m.id,
        from: get("From"),
        subject: get("Subject"),
        date: get("Date"),
        snippet: d.snippet || "",
        unread: d.labelIds?.includes("UNREAD"),
      };
    }));

    return Response.json({ messages });
  } catch (error) {
    return Response.json({ error: error.message, messages: [] }, { status: 500 });
  }
}

async function readEmail(base44, body) {
  const { messageId } = body;
  if (!messageId) return Response.json({ error: "messageId required" }, { status: 400 });

  try {
    const { accessToken } = await base44.asServiceRole.connectors.getConnection("gmail");
    const res = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}?format=full`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error?.message || "Gmail request failed");

    const headers = data.payload?.headers || [];
    const get = (name) => headers.find(h => h.name === name)?.value || "";
    let bodyText = "";
    if (data.payload?.body?.data) {
      bodyText = atob(data.payload.body.data.replace(/-/g, "+").replace(/_/g, "/"));
    } else if (data.payload?.parts) {
      const textPart = data.payload.parts.find(p => p.mimeType === "text/plain");
      if (textPart?.body?.data) bodyText = atob(textPart.body.data.replace(/-/g, "+").replace(/_/g, "/"));
    }

    return Response.json({
      id: data.id,
      from: get("From"),
      to: get("To"),
      subject: get("Subject"),
      date: get("Date"),
      body: bodyText.slice(0, 10000),
      snippet: data.snippet,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

async function sendEmail(base44, body) {
  const { to, subject, body: emailBody } = body;
  if (!to || !subject || !emailBody) return Response.json({ error: "to, subject, body required" }, { status: 400 });

  try {
    const email = [
      `To: ${to}`,
      `Subject: ${subject}`,
      "Content-Type: text/plain; charset=utf-8",
      "",
      emailBody,
    ].join("\r\n");

    const encoded = btoa(email).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

    const { accessToken } = await base44.asServiceRole.connectors.getConnection("gmail");
    const res = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({ raw: encoded }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error?.message || "Failed to send email");

    return Response.json({ success: true, message_id: data.id });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

async function draftEmailReply(base44, body) {
  const { messageId, tone } = body;
  if (!messageId) return Response.json({ error: "messageId required" }, { status: 400 });

  try {
    // Read the original email
    const emailRes = await readEmail(base44, { messageId });
    const email = await emailRes.json();

    const result = await callAIGateway({
      system: EDEN_SYSTEM_PROMPT + `\n\nDraft a reply to this email. Tone: ${tone || "professional but warm"}. Sign off as "Eden Skye\nStrategic Minds AI". Return ONLY the reply body text, no subject line.`,
      messages: [
        { role: "user", content: `From: ${email.from}\nSubject: ${email.subject}\n\n${email.body || email.snippet}` },
      ],
      temperature: 0.7,
      maxTokens: 500,
    });

    return Response.json({ draft: result.content, original: { from: email.from, subject: email.subject } });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

async function cleanInbox(base44, body) {
  const { max = 50 } = body;
  try {
    const { accessToken } = await base44.asServiceRole.connectors.getConnection("gmail");
    const res = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages?q=in:inbox&maxResults=${max}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error?.message || "Gmail request failed");

    const messages = await Promise.all((data.messages || []).slice(0, max).map(async (m) => {
      const detail = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${m.id}?format=metadata&metadataHeaders=From&metadataHeaders=Subject&metadataHeaders=Date`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      return detail.json();
    }));

    const headers = (m) => m.payload?.headers || [];
    const get = (m, name) => headers(m).find(h => h.name === name)?.value || "";

    // AI categorization
    const summaries = messages.map(m => ({ id: m.id, from: get(m, "From"), subject: get(m, "Subject"), snippet: m.snippet }));
    const result = await callAIGateway({
      system: EDEN_SYSTEM_PROMPT + `\n\nCategorize each email as one of: urgent, important, follow_up, newsletter, low_priority. Return JSON array of {id, category, reason}.`,
      messages: [{ role: "user", content: JSON.stringify(summaries) }],
      temperature: 0.3,
      maxTokens: 2000,
      jsonSchema: { type: "object", properties: { categories: { type: "array", items: { type: "object", properties: { id: { type: "string" }, category: { type: "string" }, reason: { type: "string" } } } } } },
    });

    return Response.json({ categorized: result.json?.categories || [], total: messages.length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

// ══════════════════════════════════════════════════════════════════
// TASKS
// ══════════════════════════════════════════════════════════════════

async function listTasks(base44, body) {
  const { status } = body;
  const query = status ? { status } : { status: { $ne: "completed" } };
  const tasks = await base44.entities.EdenSkyeTask.filter(query, { sort: "-created_date", limit: 100 });
  return Response.json({ tasks: tasks.items || [] });
}

async function createTask(base44, body) {
  const { title, description, category, priority, due_at, related_phone, related_email, source } = body;
  if (!title) return Response.json({ error: "title required" }, { status: 400 });
  const task = await base44.entities.EdenSkyeTask.create({
    title, description: description || "", category: category || "admin",
    priority: priority || "medium", status: "pending",
    due_at, related_phone, related_email, source: source || "manual",
  });
  return Response.json({ task });
}

async function updateTask(base44, body) {
  const { task_id, status, completed_at } = body;
  if (!task_id) return Response.json({ error: "task_id required" }, { status: 400 });
  const updates = { status };
  if (status === "completed") updates.completed_at = completed_at || new Date().toISOString();
  await base44.entities.EdenSkyeTask.update(task_id, updates);
  return Response.json({ success: true });
}

// ══════════════════════════════════════════════════════════════════
// CHAT (Direct text interface with Eden)
// ══════════════════════════════════════════════════════════════════

async function chat(base44, body) {
  const { message, conversationId } = body;
  if (!message) return Response.json({ error: "message required" }, { status: 400 });

  // Get calendar context
  let calendarContext = "";
  try {
    const { accessToken } = await base44.asServiceRole.connectors.getConnection("googlecalendar");
    const now = new Date();
    const end = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const calRes = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${encodeURIComponent(now.toISOString())}&timeMax=${encodeURIComponent(end.toISOString())}&maxResults=20&singleEvents=true&orderBy=startTime`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (calRes.ok) {
      const calData = await calRes.json();
      const events = (calData.items || []).map(e => `${e.start?.dateTime || e.start?.date}: ${e.summary || "busy"}`).join("\n");
      if (events) calendarContext = `\n\nJeremy's upcoming calendar:\n${events}`;
    }
  } catch (e) { /* optional */ }

  const result = await callAIGateway({
    system: EDEN_SYSTEM_PROMPT + calendarContext,
    messages: [{ role: "user", content: message }],
    temperature: 0.7,
    maxTokens: 800,
  });

  return Response.json({ reply: result.content });
}

async function getChatHistory(base44, body) {
  // Chat history could be stored in a dedicated entity or Conversation
  return Response.json({ messages: [] });
}