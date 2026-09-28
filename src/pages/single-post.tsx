import { Skeleton } from "@/components/ui/skeleton";
import { fetchPostBySlug } from "@/lib/posts";
import { getDate } from "@/lib/utils";
import useFramerTransition from "@/hooks/use-transition";
import {
  faFacebook,
  faXTwitter,
  faLinkedin,
  faReddit,
  faWhatsapp,
} from "@fortawesome/free-brands-svg-icons";
import { faEnvelope } from "@fortawesome/free-solid-svg-icons";
import SocialIcon from "@/components/social-icon";
import { Helmet } from "react-helmet";
import ReactMarkdown from "react-markdown";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "react-router-dom";

const SinglePostContent = () => {
  const { slug } = useParams<{ slug: string }>();
  const { isPending, error, data: post } = useQuery({
    queryKey: ["posts", slug],
    queryFn: () => fetchPostBySlug(slug ?? ""),
    enabled: Boolean(slug),
  });

  if (!slug) {
    return <main className="container py-24">Post not found.</main>;
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

  if (!post) {
    return <main className="container py-24">Post not found.</main>;
  }

  const postURL = new URL(
    typeof window !== "undefined"
      ? window.location.href
      : `https://example.com/blog/post/${post.slug}`,
  );

  return (
    <>
      <Helmet>
        <title>{post.title}</title>
      </Helmet>
      <main className="relative mt-[4.5rem] lg:mt-[161px]">
        <div className="relative flex flex-col items-center justify-center px-4 py-20 before:absolute before:inset-0 before:z-[1] before:bg-foreground/75 sm:h-96 lg:h-[30rem]">
          {post.image_url && (
            <img
              src={post.image_url}
              alt={post.image_alt ?? post.title}
              className="absolute inset-0 mb-6 h-full w-full object-cover"
            />
          )}
          <div className="relative z-[1] mx-auto max-w-4xl text-center">
            <h1 className="mb-5 text-white lg:text-5xl">{post.title}</h1>
            {post.author_name && (
              <div className="inline-flex flex-nowrap items-center text-base font-medium text-white lg:text-md">
                {post.author_image_url && (
                  <img
                    src={post.author_image_url}
                    alt={post.author_name}
                    width={48}
                    height={48}
                    className="mr-4 rounded-full"
                  />
                )}
                <span itemProp="author" itemType="https://schema.org/Person">
                  {"by "}
                  {post.author_name}
                </span>
                <span className="block">
                  <span className="mx-2 inline-block">-</span>
                  {getDate(post.publish_date)}
                </span>
              </div>
            )}
          </div>
        </div>
        <section className="border-b pb-24 pt-16">
          <div className="container">
            <div className="mx-auto max-w-[50rem]">
              <div className="mb-4 flex items-center">
                <span className="mb-2 mr-3 inline-block text-sm font-medium">
                  Share:
                </span>
                <div className="flex space-x-1">
                  <SocialIcon
                    icon={faXTwitter}
                    url={`https://twitter.com/intent/tweet?url=${postURL}&text=${encodeURI(
                      post.title,
                    )}`}
                  />
                  <SocialIcon
                    icon={faFacebook}
                    url={`https://www.facebook.com/sharer.php?u=${postURL}`}
                    className="bg-[#324e8c]"
                  />
                  <SocialIcon
                    icon={faLinkedin}
                    url={`https://www.linkedin.com/shareArticle?mini=true&url=${postURL}`}
                    className="bg-[#0a66c2]"
                  />
                  <SocialIcon
                    icon={faReddit}
                    url={`https://www.reddit.com/submit?url=${postURL}`}
                    className="bg-[#ff4500]"
                  />
                  <SocialIcon
                    icon={faWhatsapp}
                    url={`whatsapp://send?text=${postURL}`}
                    className="bg-[#25d366]"
                  />
                  <SocialIcon
                    icon={faEnvelope}
                    url={`mailto:?subject=${post.title}&body=${postURL}`}
                    className="bg-slate-500"
                  />
                </div>
              </div>
            </div>
            <article className="post-content prose prose-lg mx-auto max-w-[50rem] dark:prose-invert prose-headings:text-foreground">
              <ReactMarkdown>{post.content_markdown}</ReactMarkdown>
            </article>
          </div>
        </section>
      </main>
    </>
  );
};

const SinglePost = useFramerTransition(<SinglePostContent />);

export default SinglePost;
