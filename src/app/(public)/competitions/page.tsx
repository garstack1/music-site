"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface Competition {
  id: string;
  title: string;
  slug: string;
  description: string;
  prize: string;
  prizeType: string;
  imageUrl: string | null;
  startDate: string;
  endDate: string;
  maxEntries: number | null;
  winnerId: string | null;
  winnerPhoto: string | null;
  prizeReleased: boolean;
  _count: { entries: number };
  winner: { name: string | null } | null;
}

export default function CompetitionsPage() {
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/competitions")
      .then((r) => r.json())
      .then((data) => {
        setEnabled(data.enabled);
        setCompetitions(data.competitions || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const now = new Date();
  const active = competitions.filter((c) => new Date(c.endDate) >= now && !c.winnerId);
  const ended = competitions.filter((c) => new Date(c.endDate) < now || c.winnerId);

  if (loading) {
    return (
      <section className="bg-dark-bg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <h1 className="text-dark-text text-3xl font-bold">Competitions</h1>
          <p className="text-dark-muted mt-2">Loading...</p>
        </div>
      </section>
    );
  }

  if (!enabled) {
    return (
      <>
        <section className="bg-dark-bg">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <h1 className="text-dark-text text-3xl font-bold">Competitions</h1>
            <p className="text-dark-muted mt-2">Competitions are coming soon! Check back later.</p>
          </div>
        </section>
      </>
    );
  }

  return (
    <>
      <section className="bg-dark-bg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <h1 className="text-dark-text text-3xl md:text-4xl font-bold">Competitions</h1>
          <p className="text-dark-muted mt-2">Win free tickets and exclusive prizes. Sign up to enter!</p>
        </div>
      </section>

      <section className="bg-light-bg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Active Competitions */}
          {active.length > 0 && (
            <div className="mb-12">
              <h2 className="text-xl font-bold mb-6"><span className="text-brand">Live</span> Competitions</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {active.map((comp) => {
                  const daysLeft = Math.ceil((new Date(comp.endDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                  return (
                    <Link key={comp.id} href={`/competitions/${comp.slug}`}
                      className="bg-white border border-light-border hover:border-brand transition-colors overflow-hidden flex flex-col group">
                      {comp.imageUrl && (
                        <div className="aspect-video bg-light-surface overflow-hidden">
                          <img src={comp.imageUrl} alt={comp.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                        </div>
                      )}
                      <div className="p-5 flex-1 flex flex-col">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xs font-medium px-2 py-0.5 rounded bg-green-100 text-green-700">Live</span>
                          <span className="text-xs text-light-muted">{daysLeft} day{daysLeft === 1 ? "" : "s"} left</span>
                        </div>
                        <h3 className="font-bold text-lg group-hover:text-brand transition-colors">{comp.title}</h3>
                        <p className="text-light-muted text-sm mt-2 line-clamp-2">{comp.description}</p>
                        <div className="mt-3 flex items-center gap-2">
                          <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded font-medium">Prize: {comp.prize}</span>
                        </div>
                        <div className="mt-auto pt-4 flex items-center justify-between text-xs text-light-muted">
                          <span>{comp._count.entries} entr{comp._count.entries === 1 ? "y" : "ies"}{comp.maxEntries ? ` / ${comp.maxEntries}` : ""}</span>
                          <span>Ends {new Date(comp.endDate).toLocaleDateString("en-IE", { day: "numeric", month: "short" })}</span>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}

          {active.length === 0 && (
            <div className="text-center py-12 mb-12">
              <p className="text-light-muted">No active competitions right now. Check back soon!</p>
            </div>
          )}

          {/* Past Winners */}
          {ended.length > 0 && (
            <div>
              <h2 className="text-xl font-bold mb-6"><span className="text-brand">Past</span> Winners</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {ended.map((comp) => (
                  <div key={comp.id} className="bg-white border border-light-border overflow-hidden">
                    {comp.winnerPhoto ? (
                      <div className="aspect-video bg-light-surface overflow-hidden">
                        <img src={comp.winnerPhoto} alt="Winner" className="w-full h-full object-cover" />
                      </div>
                    ) : comp.imageUrl ? (
                      <div className="aspect-video bg-light-surface overflow-hidden opacity-60">
                        <img src={comp.imageUrl} alt={comp.title} className="w-full h-full object-cover" />
                      </div>
                    ) : null}
                    <div className="p-5">
                      <span className="text-xs font-medium px-2 py-0.5 rounded bg-light-surface text-light-muted">Ended</span>
                      <h3 className="font-bold mt-2">{comp.title}</h3>
                      <p className="text-light-muted text-sm mt-1">Prize: {comp.prize}</p>
                      {comp.winner && (
                        <p className="text-brand text-sm font-medium mt-2">
                          Winner: {comp.winner.name || "Anonymous"}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
