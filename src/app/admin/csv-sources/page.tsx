"use client";

import { useState, useEffect, useCallback } from "react";

interface CsvSource {
  id: string;
  name: string;
  url: string;
  active: boolean;
  lastPolled: string | null;
  createdAt: string;
}

interface ImportResult {
  sourceName: string;
  total: number;
  imported: number;
  updated: number;
  skipped: number;
  rejected: string[];
  errors: string[];
}

export default function AdminCsvSourcesPage() {
  const [sources, setSources] = useState<CsvSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [importing, setImporting] = useState<string | null>(null);
  const [importResults, setImportResults] = useState<ImportResult[] | null>(null);

  const fetchSources = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/csv-sources");
      const data = await res.json();
      setSources(data.sources || []);
    } catch {
      setError("Failed to load sources");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSources();
  }, [fetchSources]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setAdding(true);

    try {
      const res = await fetch("/api/admin/csv-sources", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, url }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to add source");
        setAdding(false);
        return;
      }

      setName("");
      setUrl("");
      setShowForm(false);
      fetchSources();
    } catch {
      setError("Network error");
    } finally {
      setAdding(false);
    }
  }

  async function handleToggle(id: string, currentActive: boolean) {
    try {
      await fetch(`/api/admin/csv-sources/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !currentActive }),
      });
      fetchSources();
    } catch {
      setError("Failed to update source");
    }
  }

  async function handleDelete(id: string, sourceName: string) {
    if (!confirm(`Delete "${sourceName}"? This won't delete imported events.`)) return;

    try {
      const res = await fetch(`/api/admin/csv-sources/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to delete source");
        return;
      }
      fetchSources();
    } catch {
      setError("Failed to delete source");
    }
  }

  async function handleImport(sourceId?: string) {
    setImporting(sourceId || "all");
    setImportResults(null);
    setError("");

    try {
      const res = await fetch("/api/admin/csv-sources/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sourceId ? { sourceId } : {}),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Import failed");
        setImporting(null);
        return;
      }

      setImportResults(data.results);
      fetchSources();
    } catch {
      setError("Import failed");
    } finally {
      setImporting(null);
    }
  }

  if (loading) {
    return (
      <div>
        <h1 className="text-dark-text text-2xl font-bold mb-8">CSV Sources</h1>
        <div className="text-dark-muted text-sm">Loading sources...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-dark-text text-2xl font-bold">CSV Sources</h1>
        <div className="flex items-center gap-3">
          {sources.length > 0 && (
            <button
              onClick={() => handleImport()}
              disabled={importing !== null}
              className="bg-dark-surface border border-dark-border hover:border-brand text-dark-text px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50"
            >
              {importing === "all" ? "Importing all..." : "Import All"}
            </button>
          )}
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-brand hover:bg-brand-hover text-white px-4 py-2 text-sm font-medium transition-colors"
          >
            {showForm ? "Cancel" : "+ Add Source"}
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 px-4 py-3 bg-red-900/30 border border-red-800/50 text-red-400 text-sm">
          {error}
          <button onClick={() => setError("")} className="ml-3 text-red-300 hover:text-white">
            ✕
          </button>
        </div>
      )}

      {/* Import Results */}
      {importResults && (
        <div className="mb-6 bg-dark-surface border border-dark-border p-4">
          <h3 className="text-dark-text text-sm font-semibold mb-3">Import Results</h3>
          {importResults.map((r, i) => (
            <div key={i} className="mb-3">
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="text-dark-text font-medium">{r.sourceName}</span>
                <div className="flex items-center gap-4">
                  <span className="text-dark-muted text-xs">{r.total} rows</span>
                  {r.imported > 0 && <span className="text-green-400 text-xs">{r.imported} new</span>}
                  {r.updated > 0 && <span className="text-blue-400 text-xs">{r.updated} updated</span>}
                  {r.rejected.length > 0 && <span className="text-amber-400 text-xs">{r.rejected.length} rejected</span>}
                  {r.errors.length > 0 && <span className="text-red-400 text-xs">{r.errors.length} errors</span>}
                </div>
              </div>
              {r.rejected.length > 0 && (
                <div className="bg-dark-bg border border-dark-border rounded p-2 mt-1">
                  <p className="text-amber-400 text-xs font-medium mb-1">Rejected:</p>
                  {r.rejected.map((msg, j) => (
                    <p key={j} className="text-dark-muted text-xs">- {msg}</p>
                  ))}
                </div>
              )}
              {r.errors.length > 0 && (
                <div className="bg-dark-bg border border-dark-border rounded p-2 mt-1">
                  <p className="text-red-400 text-xs font-medium mb-1">Errors:</p>
                  {r.errors.map((msg, j) => (
                    <p key={j} className="text-dark-muted text-xs">- {msg}</p>
                  ))}
                </div>
              )}
            </div>
          ))}
          <button onClick={() => setImportResults(null)} className="text-dark-muted hover:text-dark-text text-xs mt-2 transition-colors">
            Dismiss
          </button>
        </div>
      )}

      {showForm && (
        <div className="bg-dark-surface border border-dark-border p-5 mb-6">
          <h2 className="text-dark-text text-sm font-semibold mb-4">Add New CSV Source</h2>
          <form onSubmit={handleAdd} className="space-y-4">
            <div>
              <label htmlFor="sourceName" className="block text-dark-muted text-xs mb-1.5">
                Organiser Name
              </label>
              <input
                id="sourceName"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="e.g. Whelan's, Cyprus Avenue"
                className="w-full px-3 py-2 bg-dark-bg border border-dark-border text-dark-text text-sm placeholder-dark-muted focus:outline-none focus:border-brand transition-colors"
              />
            </div>
            <div>
              <label htmlFor="sourceUrl" className="block text-dark-muted text-xs mb-1.5">
                Published CSV URL
              </label>
              <input
                id="sourceUrl"
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                required
                placeholder="https://docs.google.com/spreadsheets/d/e/.../pub?output=csv"
                className="w-full px-3 py-2 bg-dark-bg border border-dark-border text-dark-text text-sm placeholder-dark-muted focus:outline-none focus:border-brand transition-colors"
              />
            </div>
            <button
              type="submit"
              disabled={adding}
              className="bg-brand hover:bg-brand-hover disabled:opacity-50 text-white px-4 py-2 text-sm font-medium transition-colors"
            >
              {adding ? "Adding..." : "Add Source"}
            </button>
          </form>
        </div>
      )}

      {sources.length === 0 ? (
        <div className="bg-dark-surface border border-dark-border p-8 text-center">
          <p className="text-dark-muted text-sm">No CSV sources yet. Add one to get started.</p>
        </div>
      ) : (
        <div className="bg-dark-surface border border-dark-border">
          <table className="w-full">
            <thead>
              <tr className="border-b border-dark-border">
                <th className="text-left text-dark-muted text-xs font-medium px-4 py-3">Name</th>
                <th className="text-left text-dark-muted text-xs font-medium px-4 py-3 hidden md:table-cell">URL</th>
                <th className="text-center text-dark-muted text-xs font-medium px-4 py-3">Status</th>
                <th className="text-center text-dark-muted text-xs font-medium px-4 py-3 hidden md:table-cell">Last Imported</th>
                <th className="text-right text-dark-muted text-xs font-medium px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sources.map((source) => (
                <tr key={source.id} className="border-b border-dark-border last:border-0 hover:bg-dark-bg/50 transition-colors">
                  <td className="px-4 py-3">
                    <span className="text-dark-text text-sm">{source.name}</span>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <span className="text-dark-muted text-xs truncate max-w-xs block">{source.url}</span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => handleToggle(source.id, source.active)}
                      className={`inline-block text-xs font-medium px-2 py-0.5 rounded ${
                        source.active ? "bg-green-900/30 text-green-400" : "bg-red-900/30 text-red-400"
                      }`}
                    >
                      {source.active ? "Active" : "Paused"}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-center hidden md:table-cell">
                    <span className="text-dark-muted text-xs">
                      {source.lastPolled
                        ? new Date(source.lastPolled).toLocaleDateString("en-IE", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })
                        : "Never"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-3">
                      <button
                        onClick={() => handleImport(source.id)}
                        disabled={importing !== null}
                        className="text-dark-muted hover:text-green-400 text-xs transition-colors disabled:opacity-50"
                      >
                        {importing === source.id ? "Importing..." : "Import"}
                      </button>
                      <button
                        onClick={() => handleDelete(source.id, source.name)}
                        className="text-dark-muted hover:text-brand text-xs transition-colors"
                      >
                        Delete
                      </button>
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
