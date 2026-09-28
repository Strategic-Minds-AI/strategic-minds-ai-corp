import { Link } from "react-router-dom";
import { BookmarkIcon } from "@heroicons/react/24/outline";
import { getDateDay, getDateMonth } from "@/lib/utils";

type Props = {
  post: Post;
};

const PostCard = ({ post }: Props) => {
  const categories = post.categories
    ?.split(",")
    .map((category) => category.trim())
    .filter(Boolean);
  const postPath = `/blog/post/${post.slug}`;

  return (
    <article
      className="hover-shadow overflow-hidden rounded-lg bg-white dark:bg-slate-850"
      itemType="https://schema.org/Article"
    >
      <figure className="after: relative overflow-hidden">
        <Link to={postPath} className="group">
          {post.image_url && (
            <img
              src={post.image_url}
              alt={post.image_alt ?? post.title}
              width={1200}
              height={800}
              className="transition-transform duration-1600 will-change-transform group-hover:scale-105"
            />
          )}
          {post.publish_date && (
            <div className="pointer-events-none absolute left-4 top-4 rounded bg-white px-4 py-3 text-center font-medium leading-none text-foreground">
              <span className="block text-md">{getDateDay(post.publish_date)}</span>
              <span className="text-[0.625rem] uppercase tracking-wider">
                {getDateMonth(post.publish_date)}
              </span>
            </div>
          )}
        </Link>
      </figure>
      <div className="rounded-b-lg p-10">
        <h2 className="mb-4 text-xl font-bold">
          <Link className="hover:text-primary" to={postPath}>
            {post.title}
          </Link>
        </h2>
        {categories && categories.length > 0 && (
          <div className="mb-5 flex">
            <BookmarkIcon width={15} className="mr-1 stroke-primary" />
            <div className="space-x-2 text-xs font-medium text-foreground dark:text-white">
              {categories.map((category) => (
                <span key={category}>{category}</span>
              ))}
            </div>
          </div>
        )}

        {post.excerpt && <p>{post.excerpt}</p>}
      </div>
    </article>
  );
};

export default PostCard;
