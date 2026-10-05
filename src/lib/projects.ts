import { base44 } from "@/api/base44Client";

const isValidProject = (project: Project) =>
  typeof project.title === "string" &&
  typeof project.slug === "string" &&
  typeof project.content_markdown === "string";

const sortProjects = (projects: Project[]) =>
  [...projects].sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0));

export const fetchProjects = async () => {
  const page = await base44.entities.Project.list({ sort: "created_date", limit: 5000 });
  const projects = (page.items as Project[]).filter(isValidProject);

  // Public reads never trigger privileged sample-data creation.
  return sortProjects(projects);
};

export const fetchProjectBySlug = async (slug: string) => {
  const projects = await fetchProjects();
  return projects.find((project) => project.slug === slug) ?? null;
};