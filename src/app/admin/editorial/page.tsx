"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

interface EditorialPost {
  id: string;
  title: string;
  slug: string;
  type: string;
  status: string;
  showInNews: boolean;
  festivalTag: string | null;
  publishedAt: string | null;
  createdAt: string;
}

const TYPE_LABELS: Record<string, string> = {
  FESTIVAL_PREVIEW: "Preview",
  FESTIVAL_UPDATE: "Update",
  FESTIVAL_RECAP: "Recap",
  CONCERT_REVIEW: "Review",
  FEATURE: "Feature",
};

const TYPE_COLOURS: Record<string, string> = {
  FESTIVAL_PREVIEW: "bg-blue-900/30 text-blue-400",
  FESTIVAL_UPDATE: "bg-purple-900/30 text-purple-400",
  FESTIVAL_RECAP: "bg-teal-900/30 text-teal-400",
  CONCERT_REVIEW: "bg-orange-900/30 text-orange-400",
  FEATURE: "bg-pink-900/30 text-pink-400",
};

export default function AdminEditorialPage() {
  const [posts, setPosts] = useState<EditorialPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("ALL");

  const fetchPosts = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/editorial");
      const data = await res.json();
      setPosts(data.posts || []);
    } catch {
      setError("Failed to load editorial posts");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  async function handleDelete(id: string, title: string) {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;
    try {
      const res = await fetch(`/api/admin/editorial/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to delete post");
        return;
      }
      fetchPosts();
    } catch {
      setError("Failed to delete post");
    }
  }

  const filtered = filter === "ALL"
    ? posts
    : posts.filter((p) => p.type === filter || p.status === filter);

  if (loading) {
    return (
      <div>
        <h1 className="text-dark-text text-2xl font-bold mb-8">Editorial</h1>
        <div className="text-dark-muted text-sm">Loading posts...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-dark-text text-2xl font-bold">Editorial</h1>
        <Link
          href="/admin/editorial/new"
          className="bg-brand hover:bg-brand-hover text-white px-4 py-2 text-sm font-medium transition-colors"
        >
          + New Post
        </Link>
      </div>

      {error && (
        <div className="mb-6 px-4 py-3 bg-red-900/30 border border-red-800/50 text-red-400 text-sm">
          {error}
          <button onClick={() => setError("")} className="ml-3 text-red-300 hover:text-white">✕</button>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {["ALL", "FESTIVAL_PREVIEW", "FESTIVAL_UPDATE", "FESTIVAL_RECAP", "CONCERT_REVIEW", "FEATURE", "DRAFT", "SCHEDULED", "PUBLISHED"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`text-xs px-3 py-1 transition-colors ${
              filter === f
                ? "bg-brand text-white"
                : "bg-dark-surface border border-dark-border text-dark-muted hover:text-dark-text"
            }`}
          >
            {f === "ALL" ? "All" : f.replace(/_/g, " ")}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="bg-dark-surface border border-dark-border p-8 text-center">
          <p className="text-dark-muted text-sm">No editorial posts yet.</p>
          <Link href="/admin/editorial/new" className="text-brand hover:text-brand-hover text-sm mt-2 inline-block">
            Create your first post →
          </Link>
        </div>
      ) : (
        <div className="bg-dark-surface border border-dark-border">
          <table className="w-full">
            <thead>
              <tr className="border-b border-dark-border">
                <th className="text-left text-dark-muted text-xs font-medium px-4 py-3">Title</th>
                <th className="text-center text-dark-muted text-xs font-medium px-4 py-3 hidden md:table-cell">Type</th>
                <th className="text-center text-dark-muted text-xs font-medium px-4 py-3">Status</th>
                <th className="text-center text-dark-muted text-xs font-medium px-4 py-3 hidden md:table-cell">In News</th>
                <th className="text-center text-dark-muted text-xs font-medium px-4 py-3 hidden md:table-cell">Publish Date</th>
                <th className="text-right text-dark-muted text-xs font-medium px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((post) => (
                <tr key={post.id} className="border-b border-dark-border last:border-0 hover:bg-dark-bg/50 transition-colors">
                  <td className="px-4 py-3">
                    <span className="text-dark-text text-sm line-clamp-1">{post.title}</span>
                    {post.festivalTag && (
                      <span className="text-dark-muted text-xs block mt-0.5">#{post.festivalTag}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center hidden md:table-cell">
                    <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded ${TYPE_COLOURS[post.type] || "bg-dark-bg text-dark-muted"}`}>
                      {TYPE_LABELS[post.type] || post.type}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded ${
                      post.status === "PUBLISHED" ? "bg-green-900/30 text-green-400" :
                      post.status === "SCHEDULED" ? "bg-blue-900/30 text-blue-400" :
                      post.status === "ARCHIVED" ? "bg-dark-bg text-dark-muted" :
                      "bg-amber-900/30 text-amber-400"
                    }`}>
                      {post.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center hidden md:table-cell">
                    {post.showInNews ? (
                      <span className="text-green-400 text-xs">✓ Yes</span>
                    ) : (
                      <span className="text-dark-muted text-xs">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center hidden md:table-cell">
                    <span className="text-dark-muted text-xs">
                      {post.publishedAt
                        ? new Date(post.publishedAt).toLocaleDateString("en-IE", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "—"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-3">
                      <Link
                        href={`/admin/editorial/${post.id}/edit`}
                        className="text-dark-muted hover:text-dark-text text-xs transition-colors"
                      >
                        Edit
                      </Link>
                      <button
                        onClick={() => handleDelete(post.id, post.title)}
                        className="text-dark-muted hover:text-brand text-xs transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
