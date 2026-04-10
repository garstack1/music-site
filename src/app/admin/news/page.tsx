"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";

interface Genre {
  id: string;
  name: string;
}

interface ArticleTag {
  genre: Genre;
}

interface NewsArticle {
  id: string;
  title: string;
  slug: string;
  summary: string | null;
  sourceUrl: string;
  imageUrl: string | null;
  featured: boolean;
  hidden: boolean;
  manual: boolean;
  publishedAt: string;
  tags: ArticleTag[];
  rssFeed: { name: string } | null;
  createdBy: { displayName: string | null; name: string | null } | null;
}

type SortColumn = "title" | "source" | "date" | "featured" | "hidden";
type SortDirection = "asc" | "desc";

export default function AdminNewsPage() {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showHidden, setShowHidden] = useState(false);
  const [sortColumn, setSortColumn] = useState<SortColumn>("date");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  const fetchArticles = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/news");
      const data = await res.json();
      setArticles(data.articles || []);
    } catch {
      setError("Failed to load articles");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchArticles();
  }, [fetchArticles]);

  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  const getSourceName = (article: NewsArticle): string => {
    if (article.rssFeed) {
      return article.rssFeed.name;
    } else if (article.manual) {
      if (article.createdBy) {
        return article.createdBy.displayName || article.createdBy.name || "Unknown User";
      }
      return "Manual";
    }
    return "Unknown";
  };

  const sortedArticles = useMemo(() => {
    const filtered = articles.filter(
      (article) => !article.hidden || showHidden
    );

    return [...filtered].sort((a, b) => {
      let compareValue = 0;

      switch (sortColumn) {
        case "title":
          compareValue = a.title.localeCompare(b.title);
          break;
        case "source":
          compareValue = getSourceName(a).localeCompare(getSourceName(b));
          break;
        case "date":
          compareValue = new Date(a.publishedAt).getTime() - new Date(b.publishedAt).getTime();
          break;
        case "featured":
          compareValue = (a.featured ? 1 : 0) - (b.featured ? 1 : 0);
          break;
        case "hidden":
          compareValue = (a.hidden ? 1 : 0) - (b.hidden ? 1 : 0);
          break;
      }

      return sortDirection === "asc" ? compareValue : -compareValue;
    });
  }, [articles, showHidden, sortColumn, sortDirection]);

  const filteredArticles = showHidden
    ? sortedArticles
    : sortedArticles.filter((a) => !a.hidden);

  useEffect(() => {
    fetchArticles();
  }, [fetchArticles]);

  async function handleToggleFeatured(id: string, currentFeatured: boolean) {
    try {
      await fetch(`/api/admin/news/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ featured: !currentFeatured }),
      });
      fetchArticles();
    } catch {
      setError("Failed to update article");
    }
  }

  async function handleToggleHidden(id: string, currentHidden: boolean) {
    try {
      await fetch(`/api/admin/news/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hidden: !currentHidden }),
      });
      fetchArticles();
    } catch {
      setError("Failed to update article");
    }
  }

  async function handleDelete(id: string, title: string) {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;

    try {
      const res = await fetch(`/api/admin/news/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to delete article");
        return;
      }
      fetchArticles();
    } catch {
      setError("Failed to delete article");
    }
  }

  const filteredArticles = showHidden
    ? articles
    : articles.filter((a) => !a.hidden);

  const hiddenCount = articles.filter((a) => a.hidden).length;

  if (loading) {
    return (
      <div>
        <h1 className="text-dark-text text-2xl font-bold mb-8">News Articles</h1>
        <div className="text-dark-muted text-sm">Loading articles...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-dark-text text-2xl font-bold">News Articles</h1>
        <div className="flex items-center gap-3">
          {hiddenCount > 0 && (
            <button
              onClick={() => setShowHidden(!showHidden)}
              className="text-dark-muted hover:text-dark-text text-xs transition-colors"
            >
              {showHidden ? "Hide hidden" : `Show hidden (${hiddenCount})`}
            </button>
          )}
          <Link
            href="/admin/news/new"
            className="bg-brand hover:bg-brand-hover text-white px-4 py-2 text-sm font-medium transition-colors"
          >
            + New Article
          </Link>
        </div>
      </div>

      {error && (
        <div className="mb-6 px-4 py-3 bg-red-900/30 border border-red-800/50 text-red-400 text-sm">
          {error}
          <button onClick={() => setError("")} className="ml-3 text-red-300 hover:text-white">
            ✕
          </button>
        </div>
      )}

      {filteredArticles.length === 0 ? (
        <div className="bg-dark-surface border border-dark-border p-8 text-center">
          <p className="text-dark-muted text-sm">No articles to show.</p>
        </div>
      ) : (
        <div className="bg-dark-surface border border-dark-border">
          <table className="w-full">
            <thead>
              <tr className="border-b border-dark-border">
                <th 
                  onClick={() => handleSort("title")}
                  className="text-left text-dark-muted text-xs font-medium px-4 py-3 cursor-pointer hover:text-dark-text transition-colors"
                >
                  Title {sortColumn === "title" && (sortDirection === "asc" ? "↑" : "↓")}
                </th>
                <th 
                  onClick={() => handleSort("source")}
                  className="text-center text-dark-muted text-xs font-medium px-4 py-3 hidden md:table-cell cursor-pointer hover:text-dark-text transition-colors"
                >
                  Source {sortColumn === "source" && (sortDirection === "asc" ? "↑" : "↓")}
                </th>
                <th className="text-center text-dark-muted text-xs font-medium px-4 py-3 hidden md:table-cell">Tags</th>
                <th 
                  onClick={() => handleSort("featured")}
                  className="text-center text-dark-muted text-xs font-medium px-4 py-3 cursor-pointer hover:text-dark-text transition-colors"
                >
                  Featured {sortColumn === "featured" && (sortDirection === "asc" ? "↑" : "↓")}
                </th>
                <th 
                  onClick={() => handleSort("hidden")}
                  className="text-center text-dark-muted text-xs font-medium px-4 py-3 cursor-pointer hover:text-dark-text transition-colors"
                >
                  Visible {sortColumn === "hidden" && (sortDirection === "asc" ? "↑" : "↓")}
                </th>
                <th 
                  onClick={() => handleSort("date")}
                  className="text-center text-dark-muted text-xs font-medium px-4 py-3 hidden md:table-cell cursor-pointer hover:text-dark-text transition-colors"
                >
                  Date {sortColumn === "date" && (sortDirection === "asc" ? "↑" : "↓")}
                </th>
                <th className="text-right text-dark-muted text-xs font-medium px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredArticles.map((article) => (
                <tr
                  key={article.id}
                  className={`border-b border-dark-border last:border-0 hover:bg-dark-bg/50 transition-colors ${
                    article.hidden ? "opacity-50" : ""
                  }`}
                >
                  <td className="px-4 py-3">
                    <span className="text-dark-text text-sm line-clamp-1">{article.title}</span>
                    <span className="text-dark-muted text-xs block mt-0.5">
                      {article.manual ? "Manual" : article.rssFeed?.name || "RSS"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center hidden md:table-cell">
                    <span className="text-dark-text text-xs font-medium">
                      {getSourceName(article)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center hidden md:table-cell">
                    <div className="flex flex-wrap justify-center gap-1">
                      {article.tags.map((tag) => (
                        <span
                          key={tag.genre.id}
                          className="bg-dark-card text-dark-muted text-[10px] px-1.5 py-0.5 rounded"
                        >
                          {tag.genre.name}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => handleToggleFeatured(article.id, article.featured)}
                      className={`inline-block text-xs font-medium px-2 py-0.5 rounded ${
                        article.featured
                          ? "bg-amber-900/30 text-amber-400"
                          : "bg-dark-card text-dark-muted"
                      }`}
                    >
                      {article.featured ? "Featured" : "Normal"}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => handleToggleHidden(article.id, article.hidden)}
                      className={`inline-block text-xs font-medium px-2 py-0.5 rounded ${
                        article.hidden
                          ? "bg-red-900/30 text-red-400"
                          : "bg-green-900/30 text-green-400"
                      }`}
                    >
                      {article.hidden ? "Hidden" : "Visible"}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-center hidden md:table-cell">
                    <span className="text-dark-muted text-xs">
                      {new Date(article.publishedAt).toLocaleDateString("en-IE", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-3">
                      <Link
                        href={`/admin/news/${article.id}/edit`}
                        className="text-dark-muted hover:text-dark-text text-xs transition-colors"
                      >
                        Edit
                      </Link>
                      <button
                        onClick={() => handleDelete(article.id, article.title)}
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
