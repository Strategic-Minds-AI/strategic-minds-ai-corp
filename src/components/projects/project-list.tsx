import ProjectCard from "@/components/projects/project-card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { fetchProjects } from "@/lib/projects";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

type ProjectListProps = {
  limit: number;
  showPagination: boolean;
  grid?: string;
};

export default function ProjectList({
  limit,
  grid,
  showPagination,
}: ProjectListProps) {
  const [visibleCount, setVisibleCount] = useState(limit);
  const { isPending, error, data } = useQuery({
    queryKey: ["projects"],
    queryFn: fetchProjects,
  });

  if (error) return "An error has occurred: " + error.message;

  const visibleProjects = data?.slice(0, visibleCount) ?? [];
  const canLoadMore = showPagination && data ? visibleCount < data.length : false;

  const content = (
    <>
      <div
        className={cn(
          "grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3",
          grid,
        )}
      >
        {isPending &&
          Array.from({ length: limit }).map((_, i) => (
            <Skeleton key={i} className="h-[45.6rem] w-full" />
          ))}

        {visibleProjects.map((project: Project) => {
          return <ProjectCard project={project} key={project.id} />;
        })}
      </div>
      {canLoadMore ? (
        <div className="mt-10 text-center">
          <Button
            size={"lg"}
            onClick={() => setVisibleCount((count) => count + limit)}
          >
            Load more
          </Button>
        </div>
      ) : null}
    </>
  );

  return content;
}
