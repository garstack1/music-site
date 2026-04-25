import Link from "next/link";

interface RelatedPost {
  id: string;
  title: string;
  slug: string;
  type: string;
  excerpt: string | null;
  coverImage: string | null;
  publishedAt: string | null;
}

const TYPE_LABELS: Record<string, string> = {
  FESTIVAL_PREVIEW: "Preview",
  FESTIVAL_UPDATE: "Update",
  FESTIVAL_RECAP: "Recap",
  CONCERT_REVIEW: "Concert Review",
  FEATURE: "Feature",
};

const TYPE_COLOURS: Record<string, string> = {
  FESTIVAL_PREVIEW: "bg-blue-600",
  FESTIVAL_UPDATE: "bg-purple-600",
  FESTIVAL_RECAP: "bg-teal-600",
  CONCERT_REVIEW: "bg-orange-600",
  FEATURE: "bg-pink-600",
};

const TYPE_LINKS: Record<string, string> = {
  FESTIVAL_PREVIEW: "/festivals",
  FESTIVAL_UPDATE: "/festivals",
  FESTIVAL_RECAP: "/festivals",
  CONCERT_REVIEW: "/features",
  FEATURE: "/features",
};

interface RelatedPostsProps {
  posts: RelatedPost[];
  title?: string;
  seeAllLink?: string;
  seeAllLabel?: string;
}

export default function RelatedPosts({
  posts,
  title = "Related Content",
  seeAllLink,
  seeAllLabel = "See all coverage",
}: RelatedPostsProps) {
  if (!posts || posts.length === 0) return null;

  return (
    <div className="mt-12 pt-8 border-t border-light-border">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-light-text font-bold text-xl">{title}</h3>
        {seeAllLink && (
          <Link
            href={seeAllLink}
            className="text-brand hover:text-brand-hover text-sm font-medium transition-colors"
          >
            {seeAllLabel} →
          </Link>
        )}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {posts.map((post) => {
          const section = TYPE_LINKS[post.type] || "/features";
          const href = `${section}/${post.slug}`;
          const colour = TYPE_COLOURS[post.type] || "bg-brand";
          const label = TYPE_LABELS[post.type] || post.type;

          return (
            <Link
              key={post.id}
              href={href}
              className="group block bg-white border border-light-border hover:border-brand transition-colors overflow-hidden"
            >
              <div className="aspect-video bg-light-surface overflow-hidden relative">
                {post.coverImage ? (
                  <img
                    src={post.coverImage}
                    alt={post.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-4xl">🎵</span>
                  </div>
                )}
                <div className="absolute top-3 left-3">
                  <span className={`${colour} text-white text-xs font-medium px-2 py-1`}>
                    {label}
                  </span>
                </div>
              </div>
              <div className="p-4">
                <h4 className="text-light-text font-semibold text-sm leading-snug group-hover:text-brand transition-colors line-clamp-2 mb-2">
                  {post.title}
                </h4>
                {post.excerpt && (
                  <p className="text-light-muted text-xs line-clamp-2 mb-2">
                    {post.excerpt}
                  </p>
                )}
                {post.publishedAt && (
                  <span className="text-light-muted text-xs">
                    {new Date(post.publishedAt).toLocaleDateString("en-IE", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
