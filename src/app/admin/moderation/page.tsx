"use client";

import { useState, useEffect, useCallback } from "react";

interface PublicReview {
  id: string;
  score: number;
  text: string | null;
  approved: boolean;
  flagged: boolean;
  createdAt: string;
  review: { title: string; artist: string; slug: string };
  user: { email: string; name: string | null };
}

export default function AdminModerationPage() {
  const [reviews, setReviews] = useState<PublicReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchReviews = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/moderation");
      const data = await res.json();
      setReviews(data.reviews || []);
    } catch {
      setError("Failed to load flagged reviews");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  async function handleAction(id: string, action: "approve" | "reject" | "delete") {
    const label = action === "delete" ? 'Permanently delete this review?' : null;
    if (label && !confirm(label)) return;

    try {
      const res = await fetch(`/api/admin/moderation/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Action failed");
        return;
      }

      fetchReviews();
    } catch {
      setError("Action failed");
    }
  }

  if (loading) {
    return (
      <div>
        <h1 className="text-dark-text text-2xl font-bold mb-8">Moderation</h1>
        <div className="text-dark-muted text-sm">Loading flagged reviews...</div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-dark-text text-2xl font-bold mb-8">Moderation</h1>

      {error && (
        <div className="mb-6 px-4 py-3 bg-red-900/30 border border-red-800/50 text-red-400 text-sm">
          {error}
          <button onClick={() => setError("")} className="ml-3 text-red-300 hover:text-white">
            ✕
          </button>
        </div>
      )}

      {reviews.length === 0 ? (
        <div className="bg-dark-surface border border-dark-border p-8 text-center">
          <p className="text-dark-muted text-sm">No flagged reviews to moderate. All clear!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <div key={review.id} className="bg-dark-surface border border-dark-border p-5">
              <div className="flex items-start justify-between gap-4 mb-3">
                <div>
                  <p className="text-dark-text text-sm font-medium">
                    {review.review.artist} — {review.review.title}
                  </p>
                  <p className="text-dark-muted text-xs mt-0.5">
                    By {review.user.name || review.user.email} · {new Date(review.createdAt).toLocaleDateString("en-IE", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
                <div className="flex-shrink-0">
                  <span className="bg-amber-900/30 text-amber-400 text-xs font-bold px-2 py-1 rounded">
                    {review.score}/10
                  </span>
                </div>
              </div>

              {review.text && (
                <div className="bg-dark-bg border border-dark-border rounded p-3 mb-4">
                  <p className="text-dark-text text-sm whitespace-pre-wrap">{review.text}</p>
                </div>
              )}

              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleAction(review.id, "approve")}
                  className="bg-green-900/30 hover:bg-green-900/50 text-green-400 text-xs font-medium px-3 py-1.5 rounded transition-colors"
                >
                  Approve
                </button>
                <button
                  onClick={() => handleAction(review.id, "reject")}
                  className="bg-red-900/30 hover:bg-red-900/50 text-red-400 text-xs font-medium px-3 py-1.5 rounded transition-colors"
                >
                  Reject
                </button>
                <button
                  onClick={() => handleAction(review.id, "delete")}
                  className="text-dark-muted hover:text-brand text-xs transition-colors ml-auto"
                >
                  Delete permanently
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
