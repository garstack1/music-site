"use client";

import { useState, useEffect, useMemo } from "react";
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
  FESTIVAL_PREVIEW: "Preview",
  FESTIVAL_UPDATE: "Update",
  FESTIVAL_RECAP: "Recap",
};

const TYPE_COLOURS: Record<string, string> = {
  FESTIVAL_PREVIEW: "bg-blue-600",
  FESTIVAL_UPDATE: "bg-purple-600",
  FESTIVAL_RECAP: "bg-teal-600",
};

function FestivalCard({ post }: { post: EditorialPost }) {
  return (
    <Link href={`/festivals/${post.slug}`} className="group block bg-white border border-light-border hover:border-brand transition-colors overflow-hidden">
      <div className="aspect-video bg-light-surface overflow-hidden relative">
        {post.coverImage ? (
          <img
            src={post.coverImage}
            alt={post.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-4xl">🎪</span>
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
  );
}

function FestivalGroup({
  tag,
  posts,
  defaultOpen,
}: {
  tag: string;
  posts: EditorialPost[];
  defaultOpen: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const label = tag.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <div className="mb-8">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-3 w-full text-left mb-4 group"
      >
        <svg
          className={`w-4 h-4 text-brand transition-transform ${open ? "rotate-90" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
        <h3 className="text-lg font-bold text-light-text group-hover:text-brand transition-colors">
          {label}
        </h3>
        <span className="text-light-muted text-sm">({posts.length})</span>
      </button>
      {open && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {posts.map((post) => (
            <FestivalCard key={post.id} post={post} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function FestivalsPage() {
  const [posts, setPosts] = useState<EditorialPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState<string>("ALL");

  useEffect(() => {
    fetch("/api/editorial?category=FESTIVALS&limit=200")
      .then((r) => r.json())
      .then((data) => setPosts(data.posts || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Get all years from published dates
  const years = useMemo(() => {
    const y = new Set<string>();
    posts.forEach((p) => {
      if (p.publishedAt) y.add(new Date(p.publishedAt).getFullYear().toString());
    });
    return [...y].sort().reverse();
  }, [posts]);

  // Filter by year if selected
  const filtered = useMemo(() => {
    if (selectedYear === "ALL") return posts;
    return posts.filter((p) => {
      if (!p.publishedAt) return false;
      return new Date(p.publishedAt).getFullYear().toString() === selectedYear;
    });
  }, [posts, selectedYear]);

  // Group by festival tag
  const grouped = useMemo(() => {
    const groups: Record<string, EditorialPost[]> = {};
    const untagged: EditorialPost[] = [];

    filtered.forEach((p) => {
      if (p.festivalTag) {
        if (!groups[p.festivalTag]) groups[p.festivalTag] = [];
        groups[p.festivalTag].push(p);
      } else {
        untagged.push(p);
      }
    });

    // Sort each group — preview first, then updates, then recap
    const typeOrder = ["FESTIVAL_PREVIEW", "FESTIVAL_UPDATE", "FESTIVAL_RECAP"];
    Object.keys(groups).forEach((tag) => {
      groups[tag].sort((a, b) => typeOrder.indexOf(a.type) - typeOrder.indexOf(b.type));
    });

    return { groups, untagged };
  }, [filtered]);

  const currentYear = new Date().getFullYear().toString();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-light-text text-3xl font-bold mb-2">Festivals</h1>
        <p className="text-light-muted">
          Previews, daily updates and full recaps from the festival circuit.
        </p>
      </div>

      {/* Year filter — only show when multiple years exist */}
      {years.length > 1 && (
        <div className="flex gap-2 mb-8 flex-wrap">
          {["ALL", ...years].map((y) => (
            <button
              key={y}
              onClick={() => setSelectedYear(y)}
              className={`text-sm px-4 py-1.5 transition-colors border ${
                selectedYear === y
                  ? "bg-brand text-white border-brand"
                  : "border-light-border text-light-muted hover:text-light-text hover:border-brand"
              }`}
            >
              {y === "ALL" ? "All Years" : y}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <div className="space-y-8">
          {[...Array(3)].map((_, i) => (
            <div key={i}>
              <div className="h-6 bg-light-surface rounded w-48 mb-4 animate-pulse" />
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(3)].map((_, j) => (
                  <div key={j} className="bg-white border border-light-border overflow-hidden animate-pulse">
                    <div className="aspect-video bg-light-surface" />
                    <div className="p-4 space-y-2">
                      <div className="h-4 bg-light-surface rounded w-3/4" />
                      <div className="h-3 bg-light-surface rounded w-full" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 border border-light-border">
          <div className="text-4xl mb-4">🎪</div>
          <p className="text-light-muted">No festival content published yet.</p>
          <p className="text-light-muted text-sm mt-1">Check back soon for previews and coverage.</p>
        </div>
      ) : (
        <div>
          {/* Tagged festival groups */}
          {Object.entries(grouped.groups).map(([tag, tagPosts], index) => (
            <FestivalGroup
              key={tag}
              tag={tag}
              posts={tagPosts}
              defaultOpen={index === 0 || selectedYear === currentYear}
            />
          ))}

          {/* Untagged posts */}
          {grouped.untagged.length > 0 && (
            <FestivalGroup
              tag="other"
              posts={grouped.untagged}
              defaultOpen={Object.keys(grouped.groups).length === 0}
            />
          )}
        </div>
      )}
    </div>
  );
}
