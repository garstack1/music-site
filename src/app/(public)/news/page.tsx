import { prisma } from "@/lib/db";
import Link from "next/link";

export const metadata = {
  title: "News - MusicSite",
  description: "Latest music news and updates",
};

async function getNews() {
  return prisma.newsArticle.findMany({
    orderBy: { publishedAt: "desc" },
    include: {
      rssFeed: true,
      tags: { include: { genre: true } },
    },
  });
}

export default async function NewsPage() {
  const articles = await getNews();
  const featured = articles.filter((a) => a.featured);
  const regular = articles.filter((a) => !a.featured);

  return (
    <>
      {/* Hero */}
      <section className="bg-dark-bg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <h1 className="text-dark-text text-3xl md:text-4xl font-bold">News</h1>
          <p className="text-dark-muted mt-2">Latest music news, announcements and updates.</p>
        </div>
      </section>

      <section className="bg-light-bg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Featured Articles */}
          {featured.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
              {featured.map((article) => (
                <Link key={article.id} href={`/news/${article.slug}`} className="group block">
                  {article.imageUrl && (
                    <div className="aspect-video bg-light-surface overflow-hidden mb-3">
                      <img
                        src={article.imageUrl}
                        alt={article.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  )}
                  <span className="text-brand text-xs font-medium tracking-widest uppercase">Featured</span>
                  <h2 className="text-xl font-bold mt-1 group-hover:text-brand transition-colors">
                    {article.title}
                  </h2>
                  <p className="text-light-muted mt-2">{article.summary}</p>
                  <div className="flex items-center gap-3 mt-3">
                    {article.tags.map((tag) => (
                      <span key={tag.id} className="text-xs bg-brand-light text-brand-dark px-2 py-1">
                        {tag.genre.name}
                      </span>
                    ))}
                    <span className="text-light-muted text-xs">
                      {new Date(article.publishedAt).toLocaleDateString("en-IE", {
                        day: "numeric", month: "long", year: "numeric",
                      })}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {/* All Articles */}
          <div className="space-y-6">
            {regular.map((article) => (
              <Link
                key={article.id}
                href={`/news/${article.slug}`}
                className="group flex gap-6 items-start border-b border-light-border pb-6"
              >
                {article.imageUrl && (
                  <div className="w-48 shrink-0 aspect-video bg-light-surface overflow-hidden hidden sm:block">
                    <img
                      src={article.imageUrl}
                      alt={article.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                )}
                <div className="flex-1">
                  <h3 className="text-lg font-semibold group-hover:text-brand transition-colors">
                    {article.title}
                  </h3>
                  <p className="text-light-muted text-sm mt-2 line-clamp-2">{article.summary}</p>
                  <div className="flex items-center gap-3 mt-3">
                    {article.rssFeed && (
                      <span className="text-xs text-light-muted">via {article.rssFeed.name}</span>
                    )}
                    {article.tags.map((tag) => (
                      <span key={tag.id} className="text-xs bg-light-surface text-light-muted px-2 py-1">
                        {tag.genre.name}
                      </span>
                    ))}
                    <span className="text-light-muted text-xs">
                      {new Date(article.publishedAt).toLocaleDateString("en-IE", {
                        day: "numeric", month: "long", year: "numeric",
                      })}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
