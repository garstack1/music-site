"use client";

import { useState } from "react";

export default function PublicReviewForm({
  slug,
  enabled,
}: {
  slug: string;
  enabled: boolean;
}) {
  const [score, setScore] = useState<number | null>(null);
  const [text, setText] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  if (!enabled) return null;

  if (success) {
    return (
      <div className="bg-green-50 border border-green-200 p-6 rounded mt-8">
        <h3 className="font-bold text-green-800">Thanks for your review!</h3>
        <p className="text-green-700 text-sm mt-1">Your review has been submitted successfully.</p>
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (score === null) {
      setError("Please select a score");
      return;
    }

    if (!email.trim()) {
      setError("Email is required");
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch(`/api/reviews/${slug}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          score,
          text: text.trim() || null,
          name: name.trim() || null,
          email: email.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to submit review");
        setSubmitting(false);
        return;
      }

      setSuccess(true);
    } catch {
      setError("Network error. Please try again.");
      setSubmitting(false);
    }
  }

  return (
    <div className="mt-8 bg-light-surface border border-light-border p-6">
      <h3 className="font-bold text-lg mb-4">Leave a Review</h3>

      {error && (
        <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Score */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Your Score <span className="text-brand">*</span>
          </label>
          <div className="flex gap-1">
            {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setScore(n)}
                className={`w-9 h-9 text-sm font-bold rounded transition-colors ${
                  score === n
                    ? "bg-brand text-white"
                    : score !== null && n <= score
                    ? "bg-brand/20 text-brand"
                    : "bg-white border border-light-border text-light-muted hover:border-brand hover:text-brand"
                }`}
              >
                {n}
              </button>
            ))}
          </div>
          {score !== null && (
            <p className="text-light-muted text-xs mt-1">
              {score <= 2 ? "Poor" : score <= 4 ? "Below Average" : score <= 6 ? "Average" : score <= 8 ? "Great" : "Outstanding!"}
            </p>
          )}
        </div>

        {/* Review Text */}
        <div>
          <label htmlFor="reviewText" className="block text-sm font-medium mb-1.5">
            Your Review <span className="text-light-muted text-xs">(optional, max 500 words)</span>
          </label>
          <textarea
            id="reviewText"
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={4}
            className="w-full px-3 py-2 border border-light-border text-sm placeholder-light-muted focus:outline-none focus:border-brand transition-colors resize-y rounded"
            placeholder="What did you think of the show?"
          />
          <p className="text-light-muted text-xs mt-1">
            {text.trim().split(/\s+/).filter(Boolean).length}/500 words
          </p>
        </div>

        {/* Name & Email */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="reviewName" className="block text-sm font-medium mb-1.5">
              Display Name <span className="text-light-muted text-xs">(optional)</span>
            </label>
            <input
              id="reviewName"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-light-border text-sm placeholder-light-muted focus:outline-none focus:border-brand transition-colors rounded"
              placeholder="Your name"
            />
          </div>
          <div>
            <label htmlFor="reviewEmail" className="block text-sm font-medium mb-1.5">
              Email <span className="text-brand">*</span>
              <span className="text-light-muted text-xs ml-1">(not displayed)</span>
            </label>
            <input
              id="reviewEmail"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-3 py-2 border border-light-border text-sm placeholder-light-muted focus:outline-none focus:border-brand transition-colors rounded"
              placeholder="your@email.com"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={submitting || score === null}
          className="bg-brand hover:bg-brand-hover disabled:opacity-50 text-white px-6 py-2.5 text-sm font-medium transition-colors rounded"
        >
          {submitting ? "Submitting..." : "Submit Review"}
        </button>
      </form>
    </div>
  );
}
