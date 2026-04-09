"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Preview {
  title: string;
  summary: string;
  body: string;
  quotes: string[];
  images: string[];
  videos: string[];
  featuredImage: string | null;
  sourceUrl: string | null;
  social: Record<string, string>;
}

export default function ImportEmailPage() {
  const router = useRouter();
  const [emailText, setEmailText] = useState("");
  const [startMarker, setStartMarker] = useState("===");
  const [endMarker, setEndMarker] = useState("******");
  const [useMarkers, setUseMarkers] = useState(true);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editSummary, setEditSummary] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handlePreview() {
    setError("");
    setPreview(null);
    setLoading(true);

    try {
      const res = await fetch("/api/admin/import-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          emailText,
          startMarker: useMarkers ? startMarker : "",
          endMarker: useMarkers ? endMarker : "",
          mode: "preview",
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to extract");
        setLoading(false);
        return;
      }

      setPreview(data.preview);
      setEditTitle(data.preview.title);
      setEditSummary(data.preview.summary);
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    setError("");
    setSaving(true);

    try {
      const res = await fetch("/api/admin/import-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          emailText,
          startMarker: useMarkers ? startMarker : "",
          endMarker: useMarkers ? endMarker : "",
          mode: "save",
          editedTitle: editTitle,
          editedSummary: editSummary,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to save");
        setSaving(false);
        return;
      }

      setSuccess("Article created as draft!");
      setTimeout(() => router.push(`/admin/news/${data.article.id}/edit`), 1500);
    } catch {
      setError("Network error");
      setSaving(false);
    }
  }

  return (
    <div>
      <h1 className="text-dark-text text-2xl font-bold mb-2">Import PR Email</h1>
      <p className="text-dark-muted text-sm mb-8">Paste a press release email and extract a news article from it.</p>

      {error && (
        <div className="mb-6 px-4 py-3 bg-red-900/30 border border-red-800/50 text-red-400 text-sm">{error}</div>
      )}
      {success && (
        <div className="mb-6 px-4 py-3 bg-green-900/30 border border-green-800/50 text-green-400 text-sm">{success}</div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-dark-surface border border-dark-border p-5">
          <h2 className="text-dark-text text-sm font-semibold mb-4">Paste Email</h2>

          <textarea
            value={emailText}
            onChange={(e) => setEmailText(e.target.value)}
            rows={20}
            className="w-full px-3 py-2 bg-dark-bg border border-dark-border text-dark-text text-sm placeholder-dark-muted focus:outline-none focus:border-brand transition-colors resize-y font-mono"
            placeholder="Paste the full email content here..."
          />

          <div className="mt-4">
            <label className="flex items-center gap-2 mb-3">
              <input type="checkbox" checked={useMarkers} onChange={(e) => setUseMarkers(e.target.checked)} className="accent-brand" />
              <span className="text-dark-muted text-xs">Use content markers</span>
            </label>

            {useMarkers && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-dark-muted text-xs mb-1">Start marker</label>
                  <input type="text" value={startMarker} onChange={(e) => setStartMarker(e.target.value)}
                    className="w-full px-3 py-2 bg-dark-bg border border-dark-border text-dark-text text-sm font-mono focus:outline-none focus:border-brand transition-colors" />
                </div>
                <div>
                  <label className="block text-dark-muted text-xs mb-1">End marker</label>
                  <input type="text" value={endMarker} onChange={(e) => setEndMarker(e.target.value)}
                    className="w-full px-3 py-2 bg-dark-bg border border-dark-border text-dark-text text-sm font-mono focus:outline-none focus:border-brand transition-colors" />
                </div>
              </div>
            )}
          </div>

          <button
            onClick={handlePreview}
            disabled={loading || !emailText.trim()}
            className="mt-4 bg-brand hover:bg-brand-hover disabled:opacity-50 text-white px-4 py-2 text-sm font-medium transition-colors"
          >
            {loading ? "Extracting..." : "Extract & Preview"}
          </button>
        </div>

        <div className="bg-dark-surface border border-dark-border p-5">
          <h2 className="text-dark-text text-sm font-semibold mb-4">Preview</h2>

          {!preview ? (
            <p className="text-dark-muted text-sm">Paste an email and click Extract to see a preview.</p>
          ) : (
            <div className="space-y-4">
              {preview.featuredImage && (
                <div>
                  <label className="block text-dark-muted text-xs mb-1">Featured Image</label>
                  <div className="aspect-video bg-dark-bg border border-dark-border overflow-hidden">
                    <img src={preview.featuredImage} alt="" className="w-full h-full object-cover" />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-dark-muted text-xs mb-1">Title (editable)</label>
                <input type="text" value={editTitle} onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-dark-bg border border-dark-border text-dark-text text-sm focus:outline-none focus:border-brand transition-colors" />
              </div>

              <div>
                <label className="block text-dark-muted text-xs mb-1">Summary (editable)</label>
                <textarea value={editSummary} onChange={(e) => setEditSummary(e.target.value)} rows={3}
                  className="w-full px-3 py-2 bg-dark-bg border border-dark-border text-dark-text text-sm focus:outline-none focus:border-brand transition-colors resize-y" />
              </div>

              <div>
                <label className="block text-dark-muted text-xs mb-1">Body preview</label>
                <div className="px-3 py-2 bg-dark-bg border border-dark-border text-dark-muted text-xs max-h-40 overflow-y-auto whitespace-pre-wrap">
                  {preview.body.slice(0, 800)}{preview.body.length > 800 ? "..." : ""}
                </div>
              </div>

              {preview.videos.length > 0 && (
                <div>
                  <label className="block text-dark-muted text-xs mb-1">Videos found ({preview.videos.length})</label>
                  <div className="space-y-1">
                    {preview.videos.map((url, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <span className="text-xs bg-red-900/30 text-red-400 px-1.5 py-0.5 rounded">
                          {url.includes("vimeo") ? "Vimeo" : "YouTube"}
                        </span>
                        <span className="text-dark-muted text-xs truncate">{url}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {preview.images.length > 0 && (
                <div>
                  <label className="block text-dark-muted text-xs mb-1">Images found ({preview.images.length})</label>
                  <div className="grid grid-cols-3 gap-2">
                    {preview.images.map((url, i) => (
                      <div key={i} className="aspect-square bg-dark-bg border border-dark-border overflow-hidden">
                        <img src={url} alt="" className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {preview.quotes.length > 0 && (
                <div>
                  <label className="block text-dark-muted text-xs mb-1">Quotes found ({preview.quotes.length})</label>
                  <div className="space-y-2">
                    {preview.quotes.slice(0, 3).map((q, i) => (
                      <div key={i} className="px-3 py-2 bg-dark-bg border border-dark-border text-dark-muted text-xs italic">
                        {q.slice(0, 200)}{q.length > 200 ? "..." : ""}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {Object.keys(preview.social).length > 0 && (
                <div>
                  <label className="block text-dark-muted text-xs mb-1">Social links</label>
                  <div className="flex gap-2 flex-wrap">
                    {Object.entries(preview.social).map(([platform]) => (
                      <span key={platform} className="text-xs bg-dark-card text-dark-muted px-2 py-0.5 rounded">{platform}</span>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-3 border-t border-dark-border">
                <p className="text-dark-muted text-xs mb-3">
                  Article will be saved as a <span className="text-amber-400">hidden draft</span>. You can edit and publish from the News section.
                </p>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white px-4 py-2 text-sm font-medium transition-colors"
                >
                  {saving ? "Saving..." : "Save as Draft"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
