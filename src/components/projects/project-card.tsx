import { Link } from "react-router-dom";
import { ChevronRightIcon } from "@heroicons/react/20/solid";

type Props = {
  project: Project;
};

const ProjectCard = ({ project }: Props) => {
  const categories = project.categories
    ?.split(",")
    .map((category) => category.trim())
    .filter(Boolean);
  const projectPath = `/projects/${project.slug}`;

  return (
    <article className="hover-shadow overflow-hidden rounded-lg hover:top-0">
      <figure className="relative overflow-hidden">
        {categories && categories.length > 0 && (
          <div className="absolute left-0 top-0 z-[1] flex space-x-1.5 p-8 text-xs font-medium">
            {categories.map((category) => (
              <span className="rounded bg-slate-850/80 px-3 py-1 text-white" key={category}>
                {category}
              </span>
            ))}
          </div>
        )}
        <Link
          to={projectPath}
          className="group after:absolute after:inset-0 after:bg-gradient-to-t after:from-slate-950/75 after:via-transparent after:via-50%"
        >
          {project.image_url && (
            <img
              src={project.image_url}
              alt={project.image_alt ?? project.title}
              width={1200}
              height={800}
              className="transition-transform duration-1600 will-change-transform group-hover:scale-105"
            />
          )}
        </Link>
        <h2 className="absolute bottom-0 mb-0 px-8 py-6 text-xl font-bold text-white hover:text-primary">
          <Link to={projectPath}>{project.title}</Link>
        </h2>
      </figure>
      <div className="rounded-b-lg bg-white p-10 dark:bg-slate-800">
        {(project.metric_1_value ||
          project.metric_1_label ||
          project.metric_2_value ||
          project.metric_2_label) && (
          <div className="mb-5 flex flex-wrap items-center lg:flex-nowrap">
            <div className="w-full p-3 text-center lg:flex-1 lg:border-r">
              {project.metric_1_value && (
                <span className="text-green block text-2xl font-bold lg:text-[2.25rem]">
                  {project.metric_1_value}
                </span>
              )}
              {project.metric_1_label && (
                <span className="text-[1.0625rem] font-bold">
                  {project.metric_1_label}
                </span>
              )}
            </div>
            <div className="w-full p-3 text-center lg:flex-1">
              {project.metric_2_value && (
                <span className="text-green block text-2xl font-bold lg:text-[2.25rem]">
                  {project.metric_2_value}
                </span>
              )}
              {project.metric_2_label && (
                <span className="text-[1.0625rem] font-bold">
                  {project.metric_2_label}
                </span>
              )}
            </div>
          </div>
        )}

        {project.excerpt && <p>{project.excerpt}</p>}
        <a
          href={projectPath}
          className="mt-6 inline-flex items-center text-sm font-bold text-secondary hover:text-primary"
        >
          View Case Study
          <ChevronRightIcon width={20} height={20} className="ml-4" />
        </a>
      </div>
    </article>
  );
};

export default ProjectCard;
