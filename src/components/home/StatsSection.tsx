"use client";

import { useState, useEffect } from "react";

interface Stats {
  totalEvents: number;
  totalArticles: number;
  totalReviews: number;
  totalTicketClicks: number;
  totalArtists: number;
  totalCities: number;
  totalCountries: number;
}

function formatNumber(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace(/\.0$/, "")}k+`;
  if (n >= 100) return `${Math.floor(n / 10) * 10}+`;
  return n.toString();
}

export default function StatsSection() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    fetch("/api/stats")
      .then((r) => r.json())
      .then((data) => {
        setEnabled(data.enabled);
        setStats(data.stats);
      })
      .catch(() => {});
  }, []);

  if (!enabled || !stats) return null;

  const items = [
    { label: "Events Listed", value: formatNumber(stats.totalEvents), icon: "\uD83C\uDFB5" },
    { label: "Artists Featured", value: formatNumber(stats.totalArtists), icon: "\uD83C\uDFA4" },
    { label: "Cities Covered", value: formatNumber(stats.totalCities), icon: "\uD83C\uDFD9\uFE0F" },
    { label: "Countries", value: stats.totalCountries.toString(), icon: "\uD83C\uDF0D" },
    { label: "News Articles", value: formatNumber(stats.totalArticles), icon: "\uD83D\uDCF0" },
    { label: "Ticket Clicks", value: formatNumber(stats.totalTicketClicks), icon: "\uD83C\uDFAB" },
  ];

  return (
    <section className="bg-dark-bg border-t border-dark-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-6">
          {items.map((item) => (
            <div key={item.label} className="text-center">
              <div className="text-2xl mb-1">{item.icon}</div>
              <div className="text-dark-text text-2xl md:text-3xl font-bold">{item.value}</div>
              <div className="text-dark-muted text-xs mt-1 tracking-wide uppercase">{item.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
