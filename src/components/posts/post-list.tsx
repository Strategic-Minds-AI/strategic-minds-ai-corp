import PostCard from "@/components/posts/post-card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchPosts } from "@/lib/posts";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

type PostListProps = {
  limit: number;
  showPagination: boolean;
  grid?: string;
};

export default function PostList({
  limit,
  grid,
  showPagination,
}: PostListProps) {
  const [visibleCount, setVisibleCount] = useState(limit);
  const { isPending, error, data } = useQuery({
    queryKey: ["posts"],
    queryFn: fetchPosts,
  });

  if (error) return "An error has occurred: " + error.message;

  const visiblePosts = data?.slice(0, visibleCount) ?? [];
  const canLoadMore = showPagination && data ? visibleCount < data.length : false;

  const content = (
    <>
      <div className={cn("grid grid-cols-1 gap-10 lg:grid-cols-3", grid)}>
        {isPending &&
          Array.from({ length: limit }).map((_, i) => (
            <Skeleton key={i} className="h-[33rem] w-full" />
          ))}

        {visiblePosts.map((post: Post) => {
          return <PostCard post={post} key={post.id} />;
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
