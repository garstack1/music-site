"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";

interface Event {
  id: string;
  name: string;
  type: string;
  artist: string | null;
  venue: string | null;
  city: string | null;
  country: string;
  date: string;
  endDate: string | null;
  genre: string | null;
  source: string;
  active: boolean;
  featured: boolean;
}

interface ImportResult {
  country: string;
  type: string;
  fetched: number;
  imported: number;
  updated: number;
  skipped: number;
  errors: string[];
}

type SortField = "name" | "type" | "location" | "date" | "source" | "featured" | "active";
type SortDir = "asc" | "desc";

export default function AdminEventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [importing, setImporting] = useState(false);
  const [importResults, setImportResults] = useState<ImportResult[] | null>(null);
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState<SortField>("date");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const fetchEvents = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/events");
      const data = await res.json();
      setEvents(data.events || []);
    } catch {
      setError("Failed to load events");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  function handleSort(field: SortField) {
    if (sortField === field) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDir(field === "date" ? "desc" : "asc");
    }
  }

  const filtered = useMemo(() => {
    let result = events;

    if (search.trim()) {
      const terms = search.toLowerCase().split(/\s+/);
      result = result.filter((e) => {
        const searchable = [e.name, e.artist, e.venue, e.city, e.country, e.genre, e.source, e.type].filter(Boolean).join(" ").toLowerCase();
        return terms.every((t) => searchable.includes(t));
      });
    }

    result = [...result].sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case "name":
          cmp = a.name.localeCompare(b.name);
          break;
        case "type":
          cmp = a.type.localeCompare(b.type);
          break;
        case "location":
          cmp = (a.city || "").localeCompare(b.city || "");
          break;
        case "date":
          cmp = new Date(a.date).getTime() - new Date(b.date).getTime();
          break;
        case "source":
          cmp = a.source.localeCompare(b.source);
          break;
        case "featured":
          cmp = (a.featured ? 1 : 0) - (b.featured ? 1 : 0);
          break;
        case "active":
          cmp = (a.active ? 1 : 0) - (b.active ? 1 : 0);
          break;
      }
      return sortDir === "asc" ? cmp : -cmp;
    });

    return result;
  }, [events, search, sortField, sortDir]);

  async function handleToggle(id: string, field: "active" | "featured", current: boolean) {
    try {
      await fetch(`/api/admin/events/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: !current }),
      });
      fetchEvents();
    } catch {
      setError("Failed to update event");
    }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    try {
      const res = await fetch(`/api/admin/events/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to delete event");
        return;
      }
      fetchEvents();
    } catch {
      setError("Failed to delete event");
    }
  }

  async function handleTicketmasterImport() {
    setImporting(true);
    setImportResults(null);
    setError("");
    try {
      const res = await fetch("/api/admin/ticketmaster", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Import failed");
        setImporting(false);
        return;
      }
      setImportResults(data.results);
      fetchEvents();
    } catch {
      setError("Import failed");
    } finally {
      setImporting(false);
    }
  }

  const sourceCount = {
    manual: events.filter((e) => e.source === "MANUAL").length,
    ticketmaster: events.filter((e) => e.source === "TICKETMASTER").length,
    csv: events.filter((e) => e.source === "CSV").length,
  };

  function SortHeader({ field, label }: { field: SortField; label: string }) {
    const isActive = sortField === field;
    return (
      <button
        onClick={() => handleSort(field)}
        className={`flex items-center gap-1 text-xs font-medium transition-colors ${
          isActive ? "text-brand" : "text-dark-muted hover:text-dark-text"
        }`}
      >
        {label}
        {isActive && (
          <svg className={`w-3 h-3 ${sortDir === "desc" ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
          </svg>
        )}
      </button>
    );
  }

  if (loading) {
    return (
      <div>
        <h1 className="text-dark-text text-2xl font-bold mb-8">Events</h1>
        <div className="text-dark-muted text-sm">Loading events...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-dark-text text-2xl font-bold">Events</h1>
        <div className="flex items-center gap-3">
          <button
            onClick={handleTicketmasterImport}
            disabled={importing}
            className="bg-dark-surface border border-dark-border hover:border-brand text-dark-text px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50"
          >
            {importing ? "Importing..." : "Import Ticketmaster"}
          </button>
          <Link
            href="/admin/events/new"
            className="bg-brand hover:bg-brand-hover text-white px-4 py-2 text-sm font-medium transition-colors"
          >
            + New Event
          </Link>
        </div>
      </div>

      {/* Stats & Search */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex gap-4">
          <span className="text-dark-muted text-xs">Total: <span className="text-dark-text">{events.length}</span></span>
          <span className="text-dark-muted text-xs">Manual: <span className="text-dark-text">{sourceCount.manual}</span></span>
          <span className="text-dark-muted text-xs">Ticketmaster: <span className="text-dark-text">{sourceCount.ticketmaster}</span></span>
          <span className="text-dark-muted text-xs">Featured: <span className="text-amber-400">{events.filter((e) => e.featured).length}</span></span>
          {sourceCount.csv > 0 && <span className="text-dark-muted text-xs">CSV: <span className="text-dark-text">{sourceCount.csv}</span></span>}
        </div>
        <div className="relative">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search events..."
            className="w-64 px-3 py-1.5 pl-8 bg-dark-surface border border-dark-border text-dark-text text-sm placeholder-dark-muted focus:outline-none focus:border-brand transition-colors"
          />
          <svg className="w-4 h-4 text-dark-muted absolute left-2.5 top-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-2 top-1.5 text-dark-muted hover:text-dark-text text-xs"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {search && (
        <p className="text-dark-muted text-xs mb-4">
          Showing {filtered.length} of {events.length} events
        </p>
      )}

      {error && (
        <div className="mb-6 px-4 py-3 bg-red-900/30 border border-red-800/50 text-red-400 text-sm">
          {error}
          <button onClick={() => setError("")} className="ml-3 text-red-300 hover:text-white">✕</button>
        </div>
      )}

      {importResults && (
        <div className="mb-6 bg-dark-surface border border-dark-border p-4">
          <h3 className="text-dark-text text-sm font-semibold mb-3">Import Results</h3>
          <div className="space-y-1">
            {importResults
              .filter((r) => r.imported > 0 || r.updated > 0 || r.errors.length > 0)
              .map((r, i) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <span className="text-dark-text">{r.country} — {r.type}</span>
                  <div className="flex items-center gap-4">
                    {r.imported > 0 && <span className="text-green-400 text-xs">{r.imported} new</span>}
                    {r.updated > 0 && <span className="text-blue-400 text-xs">{r.updated} updated</span>}
                    {r.errors.length > 0 && <span className="text-red-400 text-xs">{r.errors.length} errors</span>}
                  </div>
                </div>
              ))}
          </div>
          {importResults.every((r) => r.imported === 0 && r.updated === 0 && r.errors.length === 0) && (
            <p className="text-dark-muted text-xs">All events up to date.</p>
          )}
          <button onClick={() => setImportResults(null)} className="text-dark-muted hover:text-dark-text text-xs mt-3 transition-colors">Dismiss</button>
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="bg-dark-surface border border-dark-border p-8 text-center">
          <p className="text-dark-muted text-sm">{search ? "No events match your search." : "No events yet."}</p>
        </div>
      ) : (
        <div className="bg-dark-surface border border-dark-border overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-dark-border">
                <th className="text-left px-4 py-3"><SortHeader field="name" label="Event" /></th>
                <th className="text-center px-4 py-3 hidden md:table-cell"><SortHeader field="type" label="Type" /></th>
                <th className="text-center px-4 py-3 hidden md:table-cell"><SortHeader field="location" label="Location" /></th>
                <th className="text-center px-4 py-3"><SortHeader field="date" label="Date" /></th>
                <th className="text-center px-4 py-3 hidden md:table-cell"><SortHeader field="source" label="Source" /></th>
                <th className="text-center px-4 py-3"><SortHeader field="featured" label="Featured" /></th>
                <th className="text-center px-4 py-3"><SortHeader field="active" label="Status" /></th>
                <th className="text-right text-dark-muted text-xs font-medium px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((event) => (
                <tr key={event.id} className="border-b border-dark-border last:border-0 hover:bg-dark-bg/50 transition-colors">
                  <td className="px-4 py-3">
                    <span className="text-dark-text text-sm line-clamp-1">{event.name}</span>
                    {event.artist && <span className="text-dark-muted text-xs block mt-0.5">{event.artist}</span>}
                  </td>
                  <td className="px-4 py-3 text-center hidden md:table-cell">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded ${
                      event.type === "FESTIVAL" ? "bg-purple-900/30 text-purple-400" : "bg-blue-900/30 text-blue-400"
                    }`}>{event.type}</span>
                  </td>
                  <td className="px-4 py-3 text-center hidden md:table-cell">
                    <span className="text-dark-muted text-xs">{[event.city, event.country].filter(Boolean).join(", ")}</span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="text-dark-muted text-xs">
                      {new Date(event.date).toLocaleDateString("en-IE", { day: "numeric", month: "short", year: "numeric" })}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center hidden md:table-cell">
                    <span className={`text-xs px-2 py-0.5 rounded ${
                      event.source === "TICKETMASTER" ? "bg-teal-900/30 text-teal-400"
                        : event.source === "CSV" ? "bg-amber-900/30 text-amber-400"
                        : "bg-dark-card text-dark-muted"
                    }`}>{event.source}</span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => handleToggle(event.id, "featured", event.featured)}
                      className={`inline-block text-xs font-medium px-2 py-0.5 rounded ${
                        event.featured ? "bg-amber-900/30 text-amber-400" : "bg-dark-card text-dark-muted"
                      }`}
                    >{event.featured ? "Featured" : "Normal"}</button>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => handleToggle(event.id, "active", event.active)}
                      className={`inline-block text-xs font-medium px-2 py-0.5 rounded ${
                        event.active ? "bg-green-900/30 text-green-400" : "bg-red-900/30 text-red-400"
                      }`}
                    >{event.active ? "Active" : "Hidden"}</button>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-3">
                      <Link href={`/admin/events/${event.id}/edit`} className="text-dark-muted hover:text-dark-text text-xs transition-colors">Edit</Link>
                      <button onClick={() => handleDelete(event.id, event.name)} className="text-dark-muted hover:text-brand text-xs transition-colors">Delete</button>
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
