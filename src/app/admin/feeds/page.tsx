"use client";

import { useState, useEffect, useCallback } from "react";

interface RssFeed {
  id: string;
  name: string;
  url: string;
  sourceLabel?: string;
  active: boolean;
  lastPolled: string | null;
  createdAt: string;
  _count: { articles: number };
}

interface PollResult {
  feedName: string;
  newArticles: number;
  skipped: number;
  errors: string[];
}

export default function AdminFeedsPage() {
  const [feeds, setFeeds] = useState<RssFeed[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [sourceLabel, setSourceLabel] = useState("");
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [polling, setPolling] = useState<string | null>(null);
  const [pollResults, setPollResults] = useState<PollResult[] | null>(null);

  const fetchFeeds = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/feeds");
      const data = await res.json();
      setFeeds(data.feeds || []);
    } catch {
      setError("Failed to load feeds");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFeeds();
  }, [fetchFeeds]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setAdding(true);

    try {
      const res = await fetch("/api/admin/feeds", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, url, sourceLabel }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to add feed");
        setAdding(false);
        return;
      }

      setName("");
      setUrl("");
      setSourceLabel("");
      setShowForm(false);
      fetchFeeds();
    } catch {
      setError("Network error");
    } finally {
      setAdding(false);
    }
  }

  async function handleToggle(id: string, currentActive: boolean) {
    try {
      await fetch(`/api/admin/feeds/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !currentActive }),
      });
      fetchFeeds();
    } catch {
      setError("Failed to update feed");
    }
  }

  async function handleDelete(id: string, feedName: string) {
    if (!confirm(`Delete "${feedName}"? This won't delete its articles.`)) return;

    try {
      const res = await fetch(`/api/admin/feeds/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to delete feed");
        return;
      }
      fetchFeeds();
    } catch {
      setError("Failed to delete feed");
    }
  }

  async function handlePoll(feedId?: string) {
    setPolling(feedId || "all");
    setPollResults(null);
    setError("");

    try {
      const res = await fetch("/api/admin/feeds/poll", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(feedId ? { feedId } : {}),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Polling failed");
        setPolling(null);
        return;
      }

      setPollResults(data.results);
      fetchFeeds();
    } catch {
      setError("Polling failed");
    } finally {
      setPolling(null);
    }
  }

  if (loading) {
    return (
      <div>
        <h1 className="text-dark-text text-2xl font-bold mb-8">RSS Feeds</h1>
        <div className="text-dark-muted text-sm">Loading feeds...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-dark-text text-2xl font-bold">RSS Feeds</h1>
        <div className="flex items-center gap-3">
          <button
            onClick={() => handlePoll()}
            disabled={polling !== null}
            className="bg-dark-surface border border-dark-border hover:border-brand text-dark-text px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50"
          >
            {polling === "all" ? "Polling all..." : "Poll All Feeds"}
          </button>
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-brand hover:bg-brand-hover text-white px-4 py-2 text-sm font-medium transition-colors"
          >
            {showForm ? "Cancel" : "+ Add Feed"}
          </button>
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

      {/* Poll Results */}
      {pollResults && (
        <div className="mb-6 bg-dark-surface border border-dark-border p-4">
          <h3 className="text-dark-text text-sm font-semibold mb-3">Poll Results</h3>
          <div className="space-y-2">
            {pollResults.map((r, i) => (
              <div key={i} className="flex items-center justify-between text-sm">
                <span className="text-dark-text">{r.feedName}</span>
                <div className="flex items-center gap-4">
                  {r.newArticles > 0 && (
                    <span className="text-green-400 text-xs">{r.newArticles} new</span>
                  )}
                  {r.skipped > 0 && (
                    <span className="text-dark-muted text-xs">{r.skipped} skipped</span>
                  )}
                  {r.errors.length > 0 && (
                    <span className="text-red-400 text-xs">{r.errors.length} errors</span>
                  )}
                  {r.newArticles === 0 && r.errors.length === 0 && (
                    <span className="text-dark-muted text-xs">Up to date</span>
                  )}
                </div>
              </div>
            ))}
          </div>
          <button
            onClick={() => setPollResults(null)}
            className="text-dark-muted hover:text-dark-text text-xs mt-3 transition-colors"
          >
            Dismiss
          </button>
        </div>
      )}

      {showForm && (
        <div className="bg-dark-surface border border-dark-border p-5 mb-6">
          <h2 className="text-dark-text text-sm font-semibold mb-4">Add New Feed</h2>
          <form onSubmit={handleAdd} className="space-y-4">
            <div>
              <label htmlFor="feedName" className="block text-dark-muted text-xs mb-1.5">
                Feed Name
              </label>
              <input
                id="feedName"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="e.g. Pitchfork"
                className="w-full px-3 py-2 bg-dark-bg border border-dark-border text-dark-text text-sm placeholder-dark-muted focus:outline-none focus:border-brand transition-colors"
              />
            </div>
            <div>
              <label htmlFor="feedUrl" className="block text-dark-muted text-xs mb-1.5">
                Feed URL
              </label>
              <input
                id="feedUrl"
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                required
                placeholder="https://pitchfork.com/rss/reviews/albums/"
                className="w-full px-3 py-2 bg-dark-bg border border-dark-border text-dark-text text-sm placeholder-dark-muted focus:outline-none focus:border-brand transition-colors"
              />
            </div>

            <div>
              <label htmlFor="sourceLabel" className="block text-dark-muted text-xs mb-1.5">
                Source Label <span className="text-dark-muted">(e.g., "via Pitchfork")</span>
              </label>
              <input
                id="sourceLabel"
                type="text"
                value={sourceLabel}
                onChange={(e) => setSourceLabel(e.target.value)}
                placeholder="Leave empty to auto-generate from feed name"
                className="w-full px-3 py-2 bg-dark-bg border border-dark-border text-dark-text text-sm placeholder-dark-muted focus:outline-none focus:border-brand transition-colors"
              />
            </div>
            <button
              type="submit"
              disabled={adding}
              className="bg-brand hover:bg-brand-hover disabled:opacity-50 text-white px-4 py-2 text-sm font-medium transition-colors"
            >
              {adding ? "Adding..." : "Add Feed"}
            </button>
          </form>
        </div>
      )}

      {feeds.length === 0 ? (
        <div className="bg-dark-surface border border-dark-border p-8 text-center">
          <p className="text-dark-muted text-sm">No RSS feeds yet. Add one to get started.</p>
        </div>
      ) : (
        <div className="bg-dark-surface border border-dark-border">
          <table className="w-full">
            <thead>
              <tr className="border-b border-dark-border">
                <th className="text-left text-dark-muted text-xs font-medium px-4 py-3">Name</th>
                <th className="text-left text-dark-muted text-xs font-medium px-4 py-3 hidden md:table-cell">URL</th>
                <th className="text-center text-dark-muted text-xs font-medium px-4 py-3">Articles</th>
                <th className="text-center text-dark-muted text-xs font-medium px-4 py-3">Status</th>
                <th className="text-center text-dark-muted text-xs font-medium px-4 py-3 hidden md:table-cell">Last Polled</th>
                <th className="text-right text-dark-muted text-xs font-medium px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {feeds.map((feed) => (
                <tr key={feed.id} className="border-b border-dark-border last:border-0 hover:bg-dark-bg/50 transition-colors">
                  <td className="px-4 py-3">
                    <span className="text-dark-text text-sm">{feed.name}</span>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <span className="text-dark-muted text-xs truncate max-w-xs block">{feed.url}</span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="text-dark-text text-sm">{feed._count.articles}</span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => handleToggle(feed.id, feed.active)}
                      className={`inline-block text-xs font-medium px-2 py-0.5 rounded ${
                        feed.active
                          ? "bg-green-900/30 text-green-400"
                          : "bg-red-900/30 text-red-400"
                      }`}
                    >
                      {feed.active ? "Active" : "Paused"}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-center hidden md:table-cell">
                    <span className="text-dark-muted text-xs">
                      {feed.lastPolled
                        ? new Date(feed.lastPolled).toLocaleDateString("en-IE", {
                            day: "numeric",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "Never"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-3">
                      <button
                        onClick={() => handlePoll(feed.id)}
                        disabled={polling !== null}
                        className="text-dark-muted hover:text-green-400 text-xs transition-colors disabled:opacity-50"
                      >
                        {polling === feed.id ? "Polling..." : "Poll"}
                      </button>
                      <button
                        onClick={() => handleDelete(feed.id, feed.name)}
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
