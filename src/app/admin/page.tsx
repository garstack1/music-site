import { prisma } from "@/lib/db";
import Link from "next/link";

async function getStats() {
  const [newsCount, eventsCount, reviewsCount, feedsCount, usersCount, pendingReviews] =
    await Promise.all([
      prisma.newsArticle.count(),
      prisma.event.count({ where: { active: true } }),
      prisma.review.count(),
      prisma.rssFeed.count({ where: { active: true } }),
      prisma.user.count({ where: { role: "PUBLIC" } }),
      prisma.publicReview.count({ where: { flagged: true } }),
    ]);

  return { newsCount, eventsCount, reviewsCount, feedsCount, usersCount, pendingReviews };
}

async function getRecentActivity() {
  const [recentNews, recentEvents, recentReviews] = await Promise.all([
    prisma.newsArticle.findMany({ orderBy: { createdAt: "desc" }, take: 5 }),
    prisma.event.findMany({ orderBy: { createdAt: "desc" }, take: 5 }),
    prisma.review.findMany({ orderBy: { createdAt: "desc" }, take: 5 }),
  ]);

  return { recentNews, recentEvents, recentReviews };
}

export default async function AdminDashboard() {
  const stats = await getStats();
  const activity = await getRecentActivity();

  const statCards = [
    { label: "News Articles", value: stats.newsCount, href: "/admin/news", color: "text-blue-400" },
    { label: "Active Events", value: stats.eventsCount, href: "/admin/events", color: "text-green-400" },
    { label: "Reviews", value: stats.reviewsCount, href: "/admin/reviews", color: "text-purple-400" },
    { label: "RSS Feeds", value: stats.feedsCount, href: "/admin/feeds", color: "text-amber-400" },
    { label: "Registered Users", value: stats.usersCount, href: "#", color: "text-teal-400" },
    { label: "Flagged Reviews", value: stats.pendingReviews, href: "/admin/moderation", color: "text-brand" },
  ];

  return (
    <div>
      <h1 className="text-dark-text text-2xl font-bold mb-8">Dashboard</h1>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-10">
        {statCards.map((stat) => (
          <Link
            key={stat.label}
            href={stat.href}
            className="bg-dark-surface border border-dark-border p-4 hover:border-brand transition-colors"
          >
            <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
            <div className="text-dark-muted text-xs mt-1">{stat.label}</div>
          </Link>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-3 mb-10">
        <Link
          href="/admin/news/new"
          className="bg-brand hover:bg-brand-hover text-white px-4 py-2 text-sm font-medium transition-colors"
        >
          + New Article
        </Link>
        <Link
          href="/admin/events/new"
          className="bg-dark-surface border border-dark-border hover:border-brand text-dark-text px-4 py-2 text-sm font-medium transition-colors"
        >
          + New Event
        </Link>
        <Link
          href="/admin/reviews/new"
          className="bg-dark-surface border border-dark-border hover:border-brand text-dark-text px-4 py-2 text-sm font-medium transition-colors"
        >
          + New Review
        </Link>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Recent News */}
        <div className="bg-dark-surface border border-dark-border p-5">
          <h2 className="text-dark-text text-sm font-semibold mb-4">Recent News</h2>
          <div className="space-y-3">
            {activity.recentNews.map((article) => (
              <div key={article.id} className="border-b border-dark-border pb-3">
                <p className="text-dark-text text-sm line-clamp-1">{article.title}</p>
                <p className="text-dark-muted text-xs mt-1">
                  {new Date(article.publishedAt).toLocaleDateString("en-IE", {
                    day: "numeric", month: "short",
                  })}
                  {article.manual ? " · Manual" : " · RSS"}
                </p>
              </div>
            ))}
          </div>
          <Link href="/admin/news" className="text-brand text-xs mt-3 inline-block hover:text-brand-hover transition-colors">
            View all →
          </Link>
        </div>

        {/* Recent Events */}
        <div className="bg-dark-surface border border-dark-border p-5">
          <h2 className="text-dark-text text-sm font-semibold mb-4">Recent Events</h2>
          <div className="space-y-3">
            {activity.recentEvents.map((event) => (
              <div key={event.id} className="border-b border-dark-border pb-3">
                <p className="text-dark-text text-sm line-clamp-1">{event.name}</p>
                <p className="text-dark-muted text-xs mt-1">
                  {new Date(event.date).toLocaleDateString("en-IE", {
                    day: "numeric", month: "short",
                  })}
                  {" · "}{event.city} · {event.source}
                </p>
              </div>
            ))}
          </div>
          <Link href="/admin/events" className="text-brand text-xs mt-3 inline-block hover:text-brand-hover transition-colors">
            View all →
          </Link>
        </div>

        {/* Recent Reviews */}
        <div className="bg-dark-surface border border-dark-border p-5">
          <h2 className="text-dark-text text-sm font-semibold mb-4">Recent Reviews</h2>
          <div className="space-y-3">
            {activity.recentReviews.map((review) => (
              <div key={review.id} className="border-b border-dark-border pb-3">
                <p className="text-dark-text text-sm line-clamp-1">{review.title}</p>
                <p className="text-dark-muted text-xs mt-1">
                  {review.artist} ·{" "}
                  <span className={review.status === "PUBLISHED" ? "text-green-400" : "text-amber-400"}>
                    {review.status}
                  </span>
                </p>
              </div>
            ))}
          </div>
          <Link href="/admin/reviews" className="text-brand text-xs mt-3 inline-block hover:text-brand-hover transition-colors">
            View all →
          </Link>
        </div>
      </div>
    </div>
  );
}
