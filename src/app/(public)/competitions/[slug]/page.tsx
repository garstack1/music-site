"use client";

import { useState, useEffect, use, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";

interface Competition {
  id: string;
  title: string;
  slug: string;
  description: string;
  prize: string;
  prizeType: string;
  imageUrl: string | null;
  rules: string | null;
  startDate: string;
  endDate: string;
  maxEntries: number | null;
  winnerId: string | null;
  winnerPhoto: string | null;
  winnerComment: string | null;
  prizeReleased: boolean;
  _count: { entries: number };
  winner: { name: string | null } | null;
}

export default function CompetitionDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [competition, setCompetition] = useState<Competition | null>(null);
  const [hasEntered, setHasEntered] = useState(false);
  const [loading, setLoading] = useState(true);
  const [entering, setEntering] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    fetch(`/api/competitions/${slug}`)
      .then((r) => r.json())
      .then((data) => {
        setCompetition(data.competition || null);
        setHasEntered(data.hasEntered || false);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [slug]);

  async function handleEnter() {
    if (!agreed) {
      setError("You must agree to the terms to enter");
      return;
    }
    setError("");
    setEntering(true);

    try {
      const res = await fetch(`/api/competitions/${slug}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agreedToTerms: true }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to enter");
        setEntering(false);
        return;
      }

      setHasEntered(true);
      setSuccess("You have been entered into the competition. Good luck!");
    } catch {
      setError("Network error");
    } finally {
      setEntering(false);
    }
  }

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError("");

    const formData = new FormData();
    formData.append("photo", file);

    try {
      const res = await fetch(`/api/competitions/${slug}/winner-photo`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Upload failed");
        setUploading(false);
        return;
      }

      const refreshRes = await fetch(`/api/competitions/${slug}`);
      const refreshData = await refreshRes.json();
      setCompetition(refreshData.competition);
      setSuccess("Photo uploaded successfully! Your prize will be released shortly.");
    } catch {
      setError("Upload failed");
    } finally {
      setUploading(false);
    }
  }

  if (loading) {
    return (
      <section className="bg-dark-bg">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <p className="text-dark-muted">Loading...</p>
        </div>
      </section>
    );
  }

  if (!competition) {
    return (
      <section className="bg-dark-bg">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <p className="text-dark-text">Competition not found.</p>
        </div>
      </section>
    );
  }

  const now = new Date();
  const isLive = now >= new Date(competition.startDate) && now <= new Date(competition.endDate) && !competition.winnerId;
  const isFull = competition.maxEntries ? competition._count.entries >= competition.maxEntries : false;
  const daysLeft = isLive ? Math.ceil((new Date(competition.endDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : 0;

  return (
    <>
      <section className="bg-dark-bg">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <Link href="/competitions" className="text-dark-muted hover:text-dark-text text-sm transition-colors">
            {"<-"} Back to Competitions
          </Link>

          <div className="mt-6 flex items-center gap-3">
            {isLive && <span className="text-xs font-medium px-2 py-0.5 rounded bg-green-500 text-white">Live</span>}
            {!isLive && <span className="text-xs font-medium px-2 py-0.5 rounded bg-dark-card text-dark-muted">Ended</span>}
            {isLive && <span className="text-dark-muted text-sm">{daysLeft} day{daysLeft === 1 ? "" : "s"} left</span>}
          </div>

          <h1 className="text-dark-text text-3xl md:text-4xl font-bold mt-3">{competition.title}</h1>

          <div className="flex items-center gap-4 mt-4">
            <span className="bg-amber-500/20 text-amber-400 text-sm font-medium px-3 py-1 rounded">
              Prize: {competition.prize}
            </span>
            <span className="text-dark-muted text-sm">
              {competition._count.entries} entr{competition._count.entries === 1 ? "y" : "ies"}
              {competition.maxEntries ? ` / ${competition.maxEntries} max` : ""}
            </span>
          </div>
        </div>
      </section>

      <section className="bg-light-bg">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {competition.imageUrl && (
            <div className="aspect-video bg-light-surface overflow-hidden mb-8 rounded">
              <img src={competition.imageUrl} alt={competition.title} className="w-full h-full object-cover" />
            </div>
          )}

          <div className="prose max-w-none">
            {competition.description.split("\n").map((para, i) => (
              <p key={i} className="text-light-text leading-relaxed mb-4">{para}</p>
            ))}
          </div>

          {/* Winner announcement */}
          {competition.winner && (
            <div className="mt-8 bg-amber-50 border border-amber-200 rounded p-6">
              <h3 className="font-bold text-lg text-amber-800">Winner Announced!</h3>
              <p className="text-amber-700 mt-1">
                Congratulations to <span className="font-semibold">{competition.winner.name || "our lucky winner"}</span>!
              </p>
              {competition.winnerPhoto && (
                <div className="mt-4 max-w-sm rounded overflow-hidden">
                  <img src={competition.winnerPhoto} alt="Winner" className="w-full" />
                </div>
              )}
            </div>
          )}

          {/* Winner photo upload */}
          {competition.winnerId && !competition.winnerPhoto && user && (
            <div className="mt-8 bg-green-50 border border-green-200 rounded p-6">
              <h3 className="font-bold text-lg text-green-800">Congratulations, you won!</h3>
              <p className="text-green-700 mt-1">Please upload a photo of yourself to claim your prize.</p>
              <div className="mt-4">
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white px-4 py-2 text-sm font-medium rounded transition-colors"
                >
                  {uploading ? "Uploading..." : "Upload Photo"}
                </button>
              </div>
            </div>
          )}

          {/* Entry section */}
          {isLive && !hasEntered && (
            <div className="mt-8 bg-light-surface border border-light-border rounded p-6">
              <h3 className="font-bold text-lg mb-4">Enter This Competition</h3>

              {!user ? (
                <div>
                  <p className="text-light-muted text-sm mb-3">You need to be signed in to enter competitions.</p>
                  <Link href="/login" className="bg-brand hover:bg-brand-hover text-white px-5 py-2.5 text-sm font-medium rounded transition-colors inline-block">
                    Sign in to Enter
                  </Link>
                </div>
              ) : isFull ? (
                <p className="text-light-muted text-sm">Sorry, this competition is full.</p>
              ) : (
                <div>
                  <label className="flex items-start gap-2 mb-4">
                    <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} className="mt-1 accent-brand" />
                    <span className="text-sm text-light-muted">
                      I agree that if I win, my name may be displayed on the website and I will upload a photo before my prize is released.
                    </span>
                  </label>

                  {error && <p className="text-red-600 text-sm mb-3">{error}</p>}

                  <button
                    onClick={handleEnter}
                    disabled={entering || !agreed}
                    className="bg-brand hover:bg-brand-hover disabled:opacity-50 text-white px-5 py-2.5 text-sm font-medium rounded transition-colors"
                  >
                    {entering ? "Entering..." : "Enter Competition"}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Already entered */}
          {hasEntered && !competition.winnerId && (
            <div className="mt-8 bg-green-50 border border-green-200 rounded p-6">
              <p className="text-green-700 font-medium">You have entered this competition. Good luck!</p>
            </div>
          )}

          {success && (
            <div className="mt-4 bg-green-50 border border-green-200 rounded p-4">
              <p className="text-green-700 text-sm">{success}</p>
            </div>
          )}

          {/* Rules */}
          {competition.rules && (
            <div className="mt-8 border-t border-light-border pt-6">
              <h3 className="font-bold text-lg mb-3">Rules & Terms</h3>
              <div className="text-light-muted text-sm space-y-2">
                {competition.rules.split("\n").map((line, i) => (
                  <p key={i}>{line}</p>
                ))}
              </div>
            </div>
          )}

          {/* Dates */}
          <div className="mt-8 border-t border-light-border pt-6 text-sm text-light-muted">
            <p>Competition opens: {new Date(competition.startDate).toLocaleDateString("en-IE", { weekday: "long", day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}</p>
            <p>Competition closes: {new Date(competition.endDate).toLocaleDateString("en-IE", { weekday: "long", day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}</p>
          </div>
        </div>
      </section>
    </>
  );
}
