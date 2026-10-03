import { createClientFromRequest } from "../../shared/ownedClient.ts";
import { requireAgencyAdmin } from '../../shared/agencyAdminAccess.ts';
import sampleProjects from "./sample-projects.json" with { type: "json" };

export default async function(req) {
  if (req.method !== "POST") {
    return Response.json({ error: "Method not allowed" }, { status: 405 });
  }

  try {
    const base44 = createClientFromRequest(req);
    const access = await requireAgencyAdmin(base44);
    if (access.response) return access.response;
    const body = await req.json();
    if (body?.approved !== true) return Response.json({ error: 'Explicit approval is required before creating sample content.' }, { status: 403 });
    const existingProjects = await base44.asServiceRole.entities.Project.list("created_date", 5000);
    const existingFlatProjects = existingProjects.filter((project) =>
      typeof project.title === "string" &&
      typeof project.slug === "string" &&
      typeof project.content_markdown === "string"
    );

    if (existingFlatProjects.length > 0) {
      return Response.json({ seeded: false, count: existingFlatProjects.length });
    }

    const result = await base44.asServiceRole.entities.Project.bulkCreate(sampleProjects);

    return Response.json({ seeded: true, count: sampleProjects.length, result });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Failed to seed projects" },
      { status: 500 },
    );
  }
}