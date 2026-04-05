"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

interface Competition {
  id: string;
  title: string;
  slug: string;
  prize: string;
  prizeType: string;
  startDate: string;
  endDate: string;
  maxEntries: number | null;
  active: boolean;
  winnerId: string | null;
  winnerPhoto: string | null;
  prizeReleased: boolean;
  drawnAt: string | null;
  _count: { entries: number };
  winner: { name: string | null; email: string } | null;
}

export default function AdminCompetitionsPage() {
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [drawing, setDrawing] = useState<string | null>(null);

  const fetchCompetitions = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/competitions");
      const data = await res.json();
      setCompetitions(data.competitions || []);
    } catch {
      setError("Failed to load competitions");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCompetitions();
  }, [fetchCompetitions]);

  async function handleToggle(id: string, active: boolean) {
    try {
      await fetch(`/api/admin/competitions/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !active }),
      });
      fetchCompetitions();
    } catch {
      setError("Failed to update");
    }
  }

  async function handleDraw(id: string) {
    if (!confirm("Draw a random winner? This cannot be undone.")) return;
    setDrawing(id);
    try {
      const res = await fetch(`/api/admin/competitions/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "draw" }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Draw failed");
      }
      fetchCompetitions();
    } catch {
      setError("Draw failed");
    } finally {
      setDrawing(null);
    }
  }

  async function handleReleasePrize(id: string) {
    if (!confirm("Release the prize to the winner?")) return;
    try {
      await fetch(`/api/admin/competitions/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "releasePrize" }),
      });
      fetchCompetitions();
    } catch {
      setError("Failed to release prize");
    }
  }

  async function handleDelete(id: string, title: string) {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;
    try {
      await fetch(`/api/admin/competitions/${id}`, { method: "DELETE" });
      fetchCompetitions();
    } catch {
      setError("Failed to delete");
    }
  }

  function getStatus(comp: Competition): { label: string; color: string } {
    const now = new Date();
    if (comp.prizeReleased) return { label: "Complete", color: "bg-green-900/30 text-green-400" };
    if (comp.winnerId) return { label: "Winner Drawn", color: "bg-amber-900/30 text-amber-400" };
    if (new Date(comp.endDate) < now) return { label: "Ended", color: "bg-red-900/30 text-red-400" };
    if (new Date(comp.startDate) > now) return { label: "Scheduled", color: "bg-blue-900/30 text-blue-400" };
    return { label: "Live", color: "bg-green-900/30 text-green-400" };
  }

  if (loading) {
    return (
      <div>
        <h1 className="text-dark-text text-2xl font-bold mb-8">Competitions</h1>
        <div className="text-dark-muted text-sm">Loading...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-dark-text text-2xl font-bold">Competitions</h1>
        <Link href="/admin/competitions/new" className="bg-brand hover:bg-brand-hover text-white px-4 py-2 text-sm font-medium transition-colors">
          + New Competition
        </Link>
      </div>

      {error && (
        <div className="mb-6 px-4 py-3 bg-red-900/30 border border-red-800/50 text-red-400 text-sm">
          {error}
          <button onClick={() => setError("")} className="ml-3 text-red-300 hover:text-white">✕</button>
        </div>
      )}

      {competitions.length === 0 ? (
        <div className="bg-dark-surface border border-dark-border p-8 text-center">
          <p className="text-dark-muted text-sm">No competitions yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {competitions.map((comp) => {
            const status = getStatus(comp);
            return (
              <div key={comp.id} className="bg-dark-surface border border-dark-border p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-dark-text font-semibold">{comp.title}</h3>
                    <p className="text-dark-muted text-sm mt-1">Prize: {comp.prize} ({comp.prizeType})</p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-dark-muted">
                      <span>
                        {new Date(comp.startDate).toLocaleDateString("en-IE", { day: "numeric", month: "short" })}
                        {" \u2014 "}
                        {new Date(comp.endDate).toLocaleDateString("en-IE", { day: "numeric", month: "short", year: "numeric" })}
                      </span>
                      <span>{comp._count.entries} entries{comp.maxEntries ? ` / ${comp.maxEntries} max` : ""}</span>
                    </div>
                    {comp.winner && (
                      <p className="text-amber-400 text-sm mt-2">
                        Winner: {comp.winner.name || comp.winner.email}
                        {comp.winnerPhoto && " (photo uploaded)"}
                        {comp.prizeReleased && " \u2714 Prize released"}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded ${status.color}`}>{status.label}</span>
                    <button
                      onClick={() => handleToggle(comp.id, comp.active)}
                      className={`text-xs font-medium px-2 py-0.5 rounded ${comp.active ? "bg-green-900/30 text-green-400" : "bg-red-900/30 text-red-400"}`}
                    >
                      {comp.active ? "Active" : "Hidden"}
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-3 mt-4 pt-3 border-t border-dark-border">
                  {!comp.winnerId && new Date(comp.endDate) < new Date() && comp._count.entries > 0 && (
                    <button
                      onClick={() => handleDraw(comp.id)}
                      disabled={drawing === comp.id}
                      className="bg-amber-900/30 hover:bg-amber-900/50 text-amber-400 text-xs font-medium px-3 py-1.5 rounded transition-colors disabled:opacity-50"
                    >
                      {drawing === comp.id ? "Drawing..." : "Draw Winner"}
                    </button>
                  )}
                  {comp.winnerId && !comp.prizeReleased && comp.winnerPhoto && (
                    <button
                      onClick={() => handleReleasePrize(comp.id)}
                      className="bg-green-900/30 hover:bg-green-900/50 text-green-400 text-xs font-medium px-3 py-1.5 rounded transition-colors"
                    >
                      Release Prize
                    </button>
                  )}
                  <Link
                    href={`/admin/competitions/${comp.id}/edit`}
                    className="text-dark-muted hover:text-dark-text text-xs transition-colors"
                  >
                    Edit
                  </Link>
                  <Link
                    href={`/admin/competitions/${comp.id}`}
                    className="text-dark-muted hover:text-dark-text text-xs transition-colors"
                  >
                    View Entries
                  </Link>
                  <button
                    onClick={() => handleDelete(comp.id, comp.title)}
                    className="text-dark-muted hover:text-brand text-xs transition-colors ml-auto"
                  >
                    Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
