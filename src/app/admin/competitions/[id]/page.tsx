"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";

interface Entry {
  id: string;
  createdAt: string;
  user: { name: string | null; email: string };
}

interface Competition {
  id: string;
  title: string;
  winnerId: string | null;
  prizeReleased: boolean;
  winnerPhoto: string | null;
  entries: Entry[];
  winner: { name: string | null; email: string } | null;
}

export default function CompetitionEntriesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [competition, setCompetition] = useState<Competition | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/admin/competitions/${id}`)
      .then((r) => r.json())
      .then((data) => setCompetition(data.competition || null))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div>
        <h1 className="text-dark-text text-2xl font-bold mb-8">Competition Entries</h1>
        <div className="text-dark-muted text-sm">Loading...</div>
      </div>
    );
  }

  if (!competition) {
    return (
      <div>
        <h1 className="text-dark-text text-2xl font-bold mb-8">Competition not found</h1>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-dark-text text-2xl font-bold">{competition.title}</h1>
          <p className="text-dark-muted text-sm mt-1">{competition.entries.length} entries</p>
        </div>
        <Link href="/admin/competitions" className="text-dark-muted hover:text-dark-text text-sm transition-colors">
          Back to Competitions
        </Link>
      </div>

      {competition.winner && (
        <div className="mb-6 bg-amber-900/20 border border-amber-800/50 p-4">
          <p className="text-amber-400 font-medium">
            Winner: {competition.winner.name || competition.winner.email}
          </p>
          {competition.winnerPhoto && (
            <div className="mt-3 max-w-xs">
              <img src={competition.winnerPhoto} alt="Winner" className="rounded" />
            </div>
          )}
          <p className="text-dark-muted text-xs mt-2">
            Prize {competition.prizeReleased ? "released" : "not yet released"}
          </p>
        </div>
      )}

      {competition.entries.length === 0 ? (
        <div className="bg-dark-surface border border-dark-border p-8 text-center">
          <p className="text-dark-muted text-sm">No entries yet.</p>
        </div>
      ) : (
        <div className="bg-dark-surface border border-dark-border">
          <table className="w-full">
            <thead>
              <tr className="border-b border-dark-border">
                <th className="text-left text-dark-muted text-xs font-medium px-4 py-3">#</th>
                <th className="text-left text-dark-muted text-xs font-medium px-4 py-3">Name</th>
                <th className="text-left text-dark-muted text-xs font-medium px-4 py-3">Email</th>
                <th className="text-left text-dark-muted text-xs font-medium px-4 py-3">Entered</th>
                <th className="text-center text-dark-muted text-xs font-medium px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {competition.entries.map((entry, i) => {
                const isWinner = competition.winnerId && entry.user.email === competition.winner?.email;
                return (
                  <tr key={entry.id} className={`border-b border-dark-border last:border-0 ${isWinner ? "bg-amber-900/10" : "hover:bg-dark-bg/50"} transition-colors`}>
                    <td className="px-4 py-3 text-dark-muted text-sm">{i + 1}</td>
                    <td className="px-4 py-3 text-dark-text text-sm">{entry.user.name || "Anonymous"}</td>
                    <td className="px-4 py-3 text-dark-muted text-sm">{entry.user.email}</td>
                    <td className="px-4 py-3 text-dark-muted text-xs">
                      {new Date(entry.createdAt).toLocaleDateString("en-IE", {
                        day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
                      })}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {isWinner && (
                        <span className="text-xs font-medium px-2 py-0.5 rounded bg-amber-900/30 text-amber-400">Winner</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
