import { createClientFromRequest } from "npm:@base44/sdk";

// ── Site config ──────────────────────────────────────────────────────────────
// Keep in sync with src/config/site.ts
const SITE_OWNER_EMAIL = "base44-templates@certifiedcode.io";
const SITE_NAME = "Margin";
// ─────────────────────────────────────────────────────────────────────────────

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return Response.json({ error: "Method not allowed" }, { status: 405 });
  }

  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const t = body.form_type || "contact";

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
        to: SITE_OWNER_EMAIL,
        subject,
        body: ownerBody,
        from_name: SITE_NAME,
      });
      ownerSent = true;
    } catch (e) {
      ownerError = e instanceof Error ? e.message : "owner email not deliverable";
    }

    return Response.json({
      ok: true,
      form_type: t,
      owner_notified: ownerSent,
      owner_error: ownerError || undefined,
    });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Failed to send form emails" },
      { status: 500 }
    );
  }
});

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
        "— Sent from your Margin site contact form",
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