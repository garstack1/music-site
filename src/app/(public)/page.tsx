import { prisma } from "@/lib/db";
import StatsSection from "@/components/home/StatsSection";
import HomeFeaturedCarousel from "@/components/HomeFeaturedCarousel";
import Link from "next/link";

async function getFeaturedNewsAndEvents() {
  // Get featured news
  const featuredNews = await prisma.newsArticle.findMany({
    where: { featured: true, hidden: false },
    orderBy: { publishedAt: "desc" },
    take: 15,
  });

  // Get featured events
  const featuredEvents = await prisma.event.findMany({
    where: { featured: true, active: true },
    orderBy: { date: "asc" },
    take: 15,
  });

  // Mix and sort by date (most recent first), limit to 15 total
  const mixed = [
    ...featuredNews.map(n => ({
      id: n.id,
      type: "news" as const,
      title: n.title,
      slug: n.slug,
      imageUrl: n.imageUrl,
      date: n.publishedAt.toISOString(),
      summary: n.summary,
    })),
    ...featuredEvents.map(e => ({
      id: e.id,
      type: "event" as const,
      title: e.name,
      slug: e.id,
      imageUrl: e.imageUrl,
      date: e.date.toISOString(),
      summary: undefined,
    })),
  ]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 15);

  return mixed;
}

async function getLatestNews() {
  return prisma.newsArticle.findMany({
    where: { featured: false, hidden: false },
    orderBy: { publishedAt: "desc" },
    take: 4,
  });
}

async function getUpcomingEvents() {
  return prisma.event.findMany({
    where: { date: { gte: new Date() }, active: true },
    orderBy: { date: "asc" },
    take: 6,
  });
}

async function getLatestReviews() {
  return prisma.review.findMany({
    where: { status: "PUBLISHED" },
    orderBy: { publishedAt: "desc" },
    take: 3,
  });
}

export default async function HomePage() {
  const [featuredMixed, latestNews, upcomingEvents, latestReviews] =
    await Promise.all([
      getFeaturedNewsAndEvents(),
      getLatestNews(),
      getUpcomingEvents(),
      getLatestReviews(),
    ]);

  return (
    <>
      {/* Featured News & Events Carousel - Full Width Black Background */}
      {featuredMixed.length > 0 && (
        <section className="bg-dark-bg w-full">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <HomeFeaturedCarousel items={featuredMixed} />
          </div>
        </section>
      )}

      {/* Secondary Featured + Latest News */}
      <section className="bg-light-bg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold">Latest News</h2>
            <Link
              href="/news"
              className="text-brand hover:text-brand-hover text-sm font-medium transition-colors"
            >
              View All →
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Latest news cards */}
            {latestNews.map((article) => (
              <div key={article.id}>
                <Link href={`/news/${article.slug}`} className="group block">
                  {article.imageUrl && (
                    <div className="aspect-video bg-light-surface overflow-hidden mb-3">
                      <img
                        src={article.imageUrl}
                        alt={article.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  )}
                  <h3 className="text-lg font-semibold group-hover:text-brand transition-colors">
                    {article.title}
                  </h3>
                  <p className="text-light-muted text-sm mt-2 line-clamp-2">
                    {article.summary}
                  </p>
                  <p className="text-light-muted text-xs mt-2">
                    {new Date(article.publishedAt).toLocaleDateString("en-IE", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Upcoming Events */}
      <section className="bg-light-surface">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold">Upcoming Events</h2>
            <Link
              href="/events"
              className="text-brand hover:text-brand-hover text-sm font-medium transition-colors"
            >
              View All →
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {upcomingEvents.map((event) => (
              <Link
                key={event.id}
                href={`/events/${event.id}`}
                className="group bg-light-bg border border-light-border p-5 hover:border-brand transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <span
                      className={`text-xs font-medium tracking-widest uppercase ${
                        event.type === "FESTIVAL"
                          ? "text-brand"
                          : "text-light-muted"
                      }`}
                    >
                      {event.type === "FESTIVAL" ? "Festival" : "Concert"}
                    </span>
                    <h3 className="font-semibold mt-1 group-hover:text-brand transition-colors">
                      {event.name}
                    </h3>
                    <p className="text-light-muted text-sm mt-1">
                      {event.venue}
                    </p>
                    <p className="text-light-muted text-sm">
                      {event.city}, {event.country}
                    </p>
                  </div>
                  <div className="text-right ml-4 shrink-0">
                    <div className="text-2xl font-bold text-brand">
                      {new Date(event.date).getDate()}
                    </div>
                    <div className="text-xs text-light-muted uppercase">
                      {new Date(event.date).toLocaleDateString("en-IE", {
                        month: "short",
                      })}
                    </div>
                  </div>
                </div>
                {event.ticketUrl && (
                  <div className="mt-3 pt-3 border-t border-light-border">
                    <span className="text-brand text-xs font-medium">
                      Get Tickets →
                    </span>
                  </div>
                )}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Latest Reviews */}
      <section className="bg-dark-bg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-dark-text text-2xl font-bold">Concert Reviews</h2>
            <Link
              href="/reviews"
              className="text-brand hover:text-brand-hover text-sm font-medium transition-colors"
            >
              View All →
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {latestReviews.map((review) => (
              <Link
                key={review.id}
                href={`/reviews/${review.slug}`}
                className="group block bg-dark-surface border border-dark-border p-6 hover:border-brand transition-colors"
              >
                <span className="text-brand text-xs font-medium tracking-widest uppercase">
                  Review
                </span>
                <h3 className="text-dark-text font-semibold mt-2 group-hover:text-brand transition-colors">
                  {review.title}
                </h3>
                <div className="text-dark-muted text-sm mt-3 space-y-1">
                  <p>{review.artist} — {review.venue}</p>
                  <p>
                    {new Date(review.eventDate).toLocaleDateString("en-IE", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                </div>
                <p className="text-dark-muted text-sm mt-3 line-clamp-3">
                  {review.body.substring(0, 150)}...
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <StatsSection />
    </>
  );
}
