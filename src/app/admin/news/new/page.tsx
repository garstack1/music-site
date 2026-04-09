"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Genre {
  id: string;
  name: string;
}

export default function NewArticlePage() {
  const router = useRouter();
  const [genres, setGenres] = useState<Genre[]>([]);
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [body, setBody] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [sourceLabel, setSourceLabel] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [featured, setFeatured] = useState(false);
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/admin/genres")
      .then((res) => res.json())
      .then((data) => setGenres(data.genres || []))
      .catch(() => {});
  }, []);

  function toggleGenre(id: string) {
    setSelectedGenres((prev) =>
      prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id]
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);

    try {
      const res = await fetch("/api/admin/news", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          summary,
          body,
          sourceUrl,
          sourceLabel,
          imageUrl,
          featured,
          genreIds: selectedGenres,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to create article");
        setSaving(false);
        return;
      }

      router.push("/admin/news");
    } catch {
      setError("Network error");
      setSaving(false);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-dark-text text-2xl font-bold">New Article</h1>
        <Link
          href="/admin/news"
          className="text-dark-muted hover:text-dark-text text-sm transition-colors"
        >
          Cancel
        </Link>
      </div>

      {error && (
        <div className="mb-6 px-4 py-3 bg-red-900/30 border border-red-800/50 text-red-400 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-dark-surface border border-dark-border p-6 space-y-5">
        <div>
          <label htmlFor="title" className="block text-dark-muted text-xs mb-1.5">
            Title *
          </label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="w-full px-3 py-2 bg-dark-bg border border-dark-border text-dark-text text-sm placeholder-dark-muted focus:outline-none focus:border-brand transition-colors"
            placeholder="Article title"
          />
        </div>

        <div>
          <label htmlFor="sourceUrl" className="block text-dark-muted text-xs mb-1.5">
            Source URL *
          </label>
          <input
            id="sourceUrl"
            type="url"
            value={sourceUrl}
            onChange={(e) => setSourceUrl(e.target.value)}
            required
            className="w-full px-3 py-2 bg-dark-bg border border-dark-border text-dark-text text-sm placeholder-dark-muted focus:outline-none focus:border-brand transition-colors"
            placeholder="https://example.com/article"
          />
        </div>

        <div>
          <label htmlFor="sourceLabel" className="block text-dark-muted text-xs mb-1.5">
            Source Label <span className="text-dark-muted">(e.g., "via NME", "Press Release", "Email Submission")</span>
          </label>
          <input
            id="sourceLabel"
            type="text"
            value={sourceLabel}
            onChange={(e) => setSourceLabel(e.target.value)}
            className="w-full px-3 py-2 bg-dark-bg border border-dark-border text-dark-text text-sm placeholder-dark-muted focus:outline-none focus:border-brand transition-colors"
            placeholder="Leave empty for auto-generated label"
          />
        </div>

        <div>
          <label htmlFor="imageUrl" className="block text-dark-muted text-xs mb-1.5">
            Image URL
          </label>
          <input
            id="imageUrl"
            type="url"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            className="w-full px-3 py-2 bg-dark-bg border border-dark-border text-dark-text text-sm placeholder-dark-muted focus:outline-none focus:border-brand transition-colors"
            placeholder="https://example.com/image.jpg"
          />
        </div>

        <div>
          <label htmlFor="summary" className="block text-dark-muted text-xs mb-1.5">
            Summary
          </label>
          <textarea
            id="summary"
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 bg-dark-bg border border-dark-border text-dark-text text-sm placeholder-dark-muted focus:outline-none focus:border-brand transition-colors resize-y"
            placeholder="Brief summary of the article"
          />
        </div>

        <div>
          <label htmlFor="body" className="block text-dark-muted text-xs mb-1.5">
            Body
          </label>
          <textarea
            id="body"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={10}
            className="w-full px-3 py-2 bg-dark-bg border border-dark-border text-dark-text text-sm placeholder-dark-muted focus:outline-none focus:border-brand transition-colors resize-y"
            placeholder="Full article content"
          />
        </div>

        <div>
          <label className="block text-dark-muted text-xs mb-2">Tags</label>
          <div className="flex flex-wrap gap-2">
            {genres.map((genre) => (
              <button
                key={genre.id}
                type="button"
                onClick={() => toggleGenre(genre.id)}
                className={`text-xs px-2.5 py-1 rounded transition-colors ${
                  selectedGenres.includes(genre.id)
                    ? "bg-brand text-white"
                    : "bg-dark-card text-dark-muted hover:text-dark-text"
                }`}
              >
                {genre.name}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <input
            id="featured"
            type="checkbox"
            checked={featured}
            onChange={(e) => setFeatured(e.target.checked)}
            className="accent-brand"
          />
          <label htmlFor="featured" className="text-dark-muted text-xs">
            Featured article
          </label>
        </div>

        <div className="flex items-center gap-3 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="bg-brand hover:bg-brand-hover disabled:opacity-50 text-white px-5 py-2 text-sm font-medium transition-colors"
          >
            {saving ? "Saving..." : "Create Article"}
          </button>
          <Link
            href="/admin/news"
            className="text-dark-muted hover:text-dark-text text-sm transition-colors"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
