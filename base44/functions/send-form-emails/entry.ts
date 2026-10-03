import { createClientFromRequest } from "../../shared/ownedClient.ts";
import { requireAgencyAdmin } from '../../shared/agencyAdminAccess.ts';

// ── Site config ──────────────────────────────────────────────────────────────
// Keep in sync with src/config/site.ts
const SITE_NAME = "Strategic Minds AI";
// ─────────────────────────────────────────────────────────────────────────────

export default async function(req) {
  if (req.method !== "POST") {
    return Response.json({ error: "Method not allowed" }, { status: 405 });
  }

  try {
    const base44 = createClientFromRequest(req);
    const access = await requireAgencyAdmin(base44);
    if (access.response) return access.response;
    const raw = await req.text();
    if (raw.length > 10000) return Response.json({ error: 'Notification input too large.' }, { status: 413 });
    const body = JSON.parse(raw);
    if (!body || Array.isArray(body) || body.approved !== true) return Response.json({ error: 'Explicit approval is required before sending an agency notification.' }, { status: 403 });
    const fields = ['form_type','name','email','phone','website','service','message','query','plan_title'];
    if (Object.keys(body).some(key => key !== 'approved' && !fields.includes(key)) || fields.some(key => body[key] !== undefined && (typeof body[key] !== 'string' || body[key].length > (key === 'message' ? 5000 : 500)))) return Response.json({ error: 'Invalid notification input.' }, { status: 400 });
    const t = body.form_type || 'contact';
    if (!['contact','quotation','newsletter','newsletter_v2','search','pricing'].includes(t)) return Response.json({ error: 'Unsupported notification type.' }, { status: 400 });
    if (typeof access.user.email !== 'string' || !access.user.email) return Response.json({ error: 'No registered operator recipient is available.' }, { status: 503 });

    const lead = {
      form_type: t,
      name: body.name || "",
      email: body.email || "",
      phone: body.phone || "",
      website: body.website || "",
      service: body.service || "",
      message: body.message || "",
      query: body.query || "",
      plan_title: body.plan_title || "",
    };

    const { subject, ownerBody } = buildContent(t, lead);

    // Notify the site owner only
    let ownerSent = false;
    let ownerError = "";
    try {
      await base44.asServiceRole.integrations.Core.SendEmail({
        to: access.user.email,
        subject,
        text: ownerBody,
        from_name: SITE_NAME,
      });
      ownerSent = true;
    } catch (e) {
      ownerError = e instanceof Error ? e.message : "owner email not deliverable";
    }

    return Response.json({
      ok: ownerSent,
      form_type: t,
      owner_notified: ownerSent,
      owner_error: ownerError || undefined,
    }, { status: ownerSent ? 200 : 502 });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Failed to send form emails" },
      { status: 500 }
    );
  }
}

function buildContent(t: string, d: Record<string, string>) {
  const ownerLine = (extra = "") => `New ${t} submission on ${SITE_NAME}.${extra}`;

  if (t === "contact") {
    return {
      subject: `New contact message from ${d.name || d.email}`,
      ownerBody: [
        ownerLine(),
        "",
        `Name: ${d.name || "-"}`,
        `Email: ${d.email || "-"}`,
        "",
        "Message:",
        d.message || "-",
        "",
        "— Sent from the Strategic Minds AI website", 
      ].join("\n"),
    };
  }

  if (t === "quotation") {
    return {
      subject: `New quotation request from ${d.name || d.email}`,
      ownerBody: [
        ownerLine(),
        "",
        `Name: ${d.name || "-"}`,
        `Email: ${d.email || "-"}`,
        `Phone: ${d.phone || "-"}`,
        `Website: ${d.website || "-"}`,
        `Service: ${d.service || "-"}`,
        "",
        "Message:",
        d.message || "-",
      ].join("\n"),
    };
  }

  if (t === "newsletter" || t === "newsletter_v2") {
    return {
      subject: `New newsletter subscriber: ${d.email || d.name || "-"}`,
      ownerBody: [
        ownerLine(),
        "",
        `Name: ${d.name || "-"}`,
        `Email: ${d.email || "-"}`,
      ].join("\n"),
    };
  }

  if (t === "search") {
    return {
      subject: `Site search: "${d.query || "-"}"`,
      ownerBody: [
        `Someone searched on ${SITE_NAME}.`,
        "",
        `Query: ${d.query || "-"}`,
      ].join("\n"),
    };
  }

  if (t === "pricing") {
    return {
      subject: `Plan interest: ${d.plan_title || "Unknown plan"}`,
      ownerBody: [
        ownerLine(" (pricing table CTA)"),
        "",
        `Interested plan: ${d.plan_title || "-"}`,
      ].join("\n"),
    };
  }

  return {
    subject: `New submission on ${SITE_NAME}`,
    ownerBody: ownerLine(),
  };
}