"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import SaveEventButton from "@/components/events/SaveEventButton";

interface NewsArticle {
  id: string;
  title: string;
  slug: string;
  summary: string | null;
  imageUrl: string | null;
  publishedAt: string;
  tags: { genre: { name: string } }[];
  rssFeed: { name: string } | null;
}

interface Event {
  id: string;
  name: string;
  type: string;
  artist: string | null;
  venue: string | null;
  city: string | null;
  country: string;
  date: string;
  ticketUrl: string | null;
  genre: string | null;
}

interface Review {
  id: string;
  title: string;
  slug: string;
  artist: string;
  venue: string;
  city: string | null;
  eventDate: string;
  coverImage: string | null;
}

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [news, setNews] = useState<NewsArticle[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const doSearch = useCallback(async (q: string) => {
    if (q.length < 2) {
      setNews([]);
      setEvents([]);
      setReviews([]);
      setSearched(false);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      setNews(data.news || []);
      setEvents(data.events || []);
      setReviews(data.reviews || []);
      setSearched(true);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      doSearch(query);
    }, 300);
    return () => clearTimeout(timer);
  }, [query, doSearch]);

  const totalResults = news.length + events.length + reviews.length;

  return (
    <>
      <section className="bg-dark-bg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <h1 className="text-dark-text text-3xl md:text-4xl font-bold mb-6">Search</h1>
          <div className="max-w-2xl">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search news, events, reviews..."
              autoFocus
              className="w-full px-5 py-3 bg-dark-surface border border-dark-border text-dark-text text-lg placeholder-dark-muted focus:outline-none focus:border-brand transition-colors rounded-none"
            />
          </div>
          {searched && !loading && (
            <p className="text-dark-muted text-sm mt-3">
              {totalResults === 0
                ? "No results found"
                : `${totalResults} result${totalResults === 1 ? "" : "s"} found`}
            </p>
          )}
          {loading && (
            <p className="text-dark-muted text-sm mt-3">Searching...</p>
          )}
        </div>
      </section>

      <section className="bg-light-bg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {!searched && !loading && (
            <p className="text-light-muted text-sm text-center py-8">
              Start typing to search across news, events, and reviews.
            </p>
          )}

          {/* News Results */}
          {news.length > 0 && (
            <div className="mb-10">
              <h2 className="text-xl font-bold mb-4">
                <span className="text-brand">News</span> ({news.length})
              </h2>
              <div className="space-y-4">
                {news.map((article) => (
                  <Link
                    key={article.id}
                    href={`/news/${article.slug}`}
                    className="flex gap-4 items-start border-b border-light-border pb-4 group"
                  >
                    {article.imageUrl && (
                      <div className="w-24 h-16 shrink-0 bg-light-surface overflow-hidden hidden sm:block">
                        <img
                          src={article.imageUrl}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <div className="flex-1">
                      <h3 className="font-semibold group-hover:text-brand transition-colors">
                        {article.title}
                      </h3>
                      {article.summary && (
                        <p className="text-light-muted text-sm mt-1 line-clamp-1">
                          {article.summary}
                        </p>
                      )}
                      <div className="flex items-center gap-2 mt-1">
                        {article.rssFeed && (
                          <span className="text-xs text-light-muted">via {article.rssFeed.name}</span>
                        )}
                        <span className="text-xs text-light-muted">
                          {new Date(article.publishedAt).toLocaleDateString("en-IE", {
                            day: "numeric", month: "short", year: "numeric",
                          })}
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Event Results */}
          {events.length > 0 && (
            <div className="mb-10">
              <h2 className="text-xl font-bold mb-4">
                <span className="text-brand">Events</span> ({events.length})
              </h2>
              <div className="space-y-4">
                {events.map((event) => (
                  <div
                    key={event.id}
                    className="flex items-center gap-6 border-b border-light-border pb-4"
                  >
                    <div className="text-center w-16 shrink-0">
                      <div className="text-2xl font-bold text-brand">
                        {new Date(event.date).getDate()}
                      </div>
                      <div className="text-xs text-light-muted uppercase">
                        {new Date(event.date).toLocaleDateString("en-IE", { month: "short" })}
                      </div>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold">{event.name}</h3>
                      <p className="text-light-muted text-sm">
                        {[event.venue, event.city, event.country].filter(Boolean).join(", ")}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded ${
                          event.type === "FESTIVAL"
                            ? "bg-purple-100 text-purple-700"
                            : "bg-blue-100 text-blue-700"
                        }`}>
                          {event.type}
                        </span>
                        {event.genre && (
                          <span className="text-xs bg-light-surface text-light-muted px-2 py-0.5">
                            {event.genre}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="shrink-0">
                      <SaveEventButton eventId={event.id} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Review Results */}
          {reviews.length > 0 && (
            <div>
              <h2 className="text-xl font-bold mb-4">
                <span className="text-brand">Reviews</span> ({reviews.length})
              </h2>
              <div className="space-y-4">
                {reviews.map((review) => (
                  <Link
                    key={review.id}
                    href={`/reviews/${review.slug}`}
                    className="flex gap-4 items-start border-b border-light-border pb-4 group"
                  >
                    {review.coverImage && (
                      <div className="w-24 h-16 shrink-0 bg-light-surface overflow-hidden hidden sm:block">
                        <img
                          src={review.coverImage}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <div className="flex-1">
                      <h3 className="font-semibold group-hover:text-brand transition-colors">
                        {review.title}
                      </h3>
                      <p className="text-light-muted text-sm mt-1">
                        {review.artist} {"—"} {[review.venue, review.city].filter(Boolean).join(", ")}
                      </p>
                      <span className="text-xs text-light-muted">
                        {new Date(review.eventDate).toLocaleDateString("en-IE", {
                          day: "numeric", month: "short", year: "numeric",
                        })}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
