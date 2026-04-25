"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface EditorialPost {
  id: string;
  title: string;
  slug: string;
  type: string;
  excerpt: string | null;
  coverImage: string | null;
  festivalTag: string | null;
  publishedAt: string | null;
}

const TYPE_LABELS: Record<string, string> = {
  FEATURE: "Feature",
  CONCERT_REVIEW: "Concert Review",
};

const TYPE_COLOURS: Record<string, string> = {
  FEATURE: "bg-pink-600",
  CONCERT_REVIEW: "bg-orange-600",
};

export default function FeaturesPage() {
  const [posts, setPosts] = useState<EditorialPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("ALL");

  useEffect(() => {
    fetch("/api/editorial?category=FEATURES&limit=50")
      .then((r) => r.json())
      .then((data) => setPosts(data.posts || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = filter === "ALL"
    ? posts
    : posts.filter((p) => p.type === filter);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-light-text text-3xl font-bold mb-2">Features</h1>
        <p className="text-light-muted">
          In-depth articles, guides, lists and concert reviews.
        </p>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-8 flex-wrap">
        {["ALL", "FEATURE", "CONCERT_REVIEW"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`text-sm px-4 py-1.5 transition-colors border ${
              filter === f
                ? "bg-brand text-white border-brand"
                : "border-light-border text-light-muted hover:text-light-text hover:border-brand"
            }`}
          >
            {f === "ALL" ? "All" : TYPE_LABELS[f]}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white border border-light-border overflow-hidden animate-pulse">
              <div className="aspect-video bg-light-surface" />
              <div className="p-4 space-y-2">
                <div className="h-4 bg-light-surface rounded w-3/4" />
                <div className="h-3 bg-light-surface rounded w-full" />
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 border border-light-border">
          <div className="text-4xl mb-4">✍️</div>
          <p className="text-light-muted">No features published yet.</p>
          <p className="text-light-muted text-sm mt-1">Check back soon.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((post) => (
            <Link
              key={post.id}
              href={`/features/${post.slug}`}
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
                    <span className="text-4xl">✍️</span>
                  </div>
                )}
                <div className="absolute top-3 left-3">
                  <span className={`${TYPE_COLOURS[post.type] || "bg-brand"} text-white text-xs font-medium px-2 py-1`}>
                    {TYPE_LABELS[post.type] || post.type}
                  </span>
                </div>
              </div>
              <div className="p-4">
                <h2 className="text-light-text font-semibold text-base leading-snug group-hover:text-brand transition-colors line-clamp-2 mb-2">
                  {post.title}
                </h2>
                {post.excerpt && (
                  <p className="text-light-muted text-sm line-clamp-2 mb-3">{post.excerpt}</p>
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
          ))}
        </div>
      )}
    </div>
  );
}
