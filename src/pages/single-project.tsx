import useFramerTransition from "@/hooks/use-transition";
import SectionQuotation from "@/components/sections/section-quotation";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchProjectBySlug } from "@/lib/projects";
import { Helmet } from "react-helmet";
import ReactMarkdown from "react-markdown";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import PageHero from '@/components/agency/PageHero';

const SingleProjectContent = () => {
  const { slug } = useParams<{ slug: string }>();
  const { isPending, error, data: project } = useQuery({
    queryKey: ["projects", slug],
    queryFn: () => fetchProjectBySlug(slug ?? ""),
    enabled: Boolean(slug),
  });

  if (!slug) {
    return <main className="container py-24">Project not found.</main>;
  }

  if (isPending) {
    return (
      <main className="relative mt-[4.5rem] lg:mt-[161px]">
        <div className="container py-24">
          <Skeleton className="mb-8 h-96 w-full" />
          <Skeleton className="mx-auto h-10 max-w-[50rem]" />
        </div>
      </main>
    );
  }

  if (error) {
    return <main className="container py-24">An error has occurred: {error.message}</main>;
  }

  if (!project) {
    return <main className="container py-24">Project not found.</main>;
  }

  return (
    <>
      <Helmet>
        <title>{project.title}</title>
      </Helmet>
      <main className="relative">
        <PageHero eyebrow="OUR WORK / STRATEGIC MINDS AI" title={project.title} description={project.excerpt} ctaLabel="Discuss a similar project" />

        {(project.metric_1_value ||
          project.metric_1_label ||
          project.metric_2_value ||
          project.metric_2_label ||
          project.metric_3_value ||
          project.metric_3_label) && (
          <div className="relative z-[1] mx-auto mt-10 mb-5 flex max-w-[50rem] flex-wrap items-center space-y-5 lg:flex-nowrap lg:space-x-10 lg:space-y-0">
            {project.metric_1_value || project.metric_1_label ? (
              <div className="w-full rounded border border-border bg-card p-12 shadow-sm lg:flex-1">
                {project.metric_1_value && (
                  <span className="mb-4 block text-2xl font-bold text-primary lg:text-[2.25rem]">
                    {project.metric_1_value}
                  </span>
                )}
                {project.metric_1_label && (
                  <span className="text-[1.0625rem] font-bold text-foreground dark:text-slate-400">
                    {project.metric_1_label}
                  </span>
                )}
              </div>
            ) : null}

            {project.metric_2_value || project.metric_2_label ? (
              <div className="w-full rounded border border-border bg-card p-12 shadow-sm lg:flex-1">
                {project.metric_2_value && (
                  <span className="mb-4 block text-2xl font-bold text-primary lg:text-[2.25rem]">
                    {project.metric_2_value}
                  </span>
                )}
                {project.metric_2_label && (
                  <span className="text-[1.0625rem] font-bold text-foreground dark:text-slate-400">
                    {project.metric_2_label}
                  </span>
                )}
              </div>
            ) : null}

            {project.metric_3_value || project.metric_3_label ? (
              <div className="w-full rounded border border-border bg-card p-12 shadow-sm lg:flex-1">
                {project.metric_3_value && (
                  <span className="mb-4 block text-2xl font-bold text-primary lg:text-[2.25rem]">
                    {project.metric_3_value}
                  </span>
                )}
                {project.metric_3_label && (
                  <span className="text-[1.0625rem] font-bold text-foreground dark:text-slate-400">
                    {project.metric_3_label}
                  </span>
                )}
              </div>
            ) : null}
          </div>
        )}

        <section className="pb-24 pt-16">
          <div className="container">
            <article className="prose prose-lg mx-auto max-w-[50rem] dark:prose-invert prose-headings:text-foreground">
              {project.image_url && <img src={project.image_url} alt={project.image_alt ?? project.title} className="mb-10 w-full rounded-md object-cover" />}
              <ReactMarkdown>{project.content_markdown}</ReactMarkdown>
            </article>
          </div>
        </section>
        <SectionQuotation />
      </main>
    </>
  );
};

const SingleProject = useFramerTransition(<SingleProjectContent />);

export default SingleProject;