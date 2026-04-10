"use client";

import { useState, useEffect } from "react";

interface FestivalResult {
  name: string;
  startDate: string | null;
  endDate: string | null;
  venue: string | null;
  city: string | null;
  country: string | null;
  latitude: number | null;
  longitude: number | null;
  genre: string | null;
  description: string | null;
  ticketUrl: string | null;
  websiteUrl: string | null;
  imageUrl: string | null;
  lineup: string[];
  source: string;
  selected?: boolean;
}

interface SavedSearch {
  id: string;
  name: string;
  searchQuery: string;
  region: string | null;
  genre: string | null;
  active: boolean;
  lastSearched: string | null;
  resultsCount: number | null;
  createdAt: string;
}

export default function EventSourcesPage() {
  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<FestivalResult[]>([]);
  const [searchError, setSearchError] = useState("");

  // Saved searches state
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);
  const [loadingSaved, setLoadingSaved] = useState(true);

  // Import state
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  // Save search state
  const [saveSearchName, setSaveSearchName] = useState("");
  const [showSaveDialog, setShowSaveDialog] = useState(false);

  // Load saved searches on mount
  useEffect(() => {
    loadSavedSearches();
  }, []);

  async function loadSavedSearches() {
    try {
      const res = await fetch("/api/admin/festival-search");
      if (res.ok) {
        const data = await res.json();
        setSavedSearches(data.searches || []);
      }
    } catch {
      console.error("Failed to load saved searches");
    } finally {
      setLoadingSaved(false);
    }
  }

  async function handleSearch(query?: string) {
    const searchTerm = query || searchQuery;
    if (!searchTerm.trim()) return;

    setSearching(true);
    setSearchError("");
    setSearchResults([]);
    setImportResult(null);

    try {
      const res = await fetch("/api/admin/festival-search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: searchTerm }),
      });

      const data = await res.json();

      if (!res.ok) {
        setSearchError(data.error || "Search failed");
        return;
      }

      // Add selected property to each result
      const resultsWithSelection = (data.festivals || []).map(
        (f: FestivalResult) => ({
          ...f,
          selected: true, // Default to selected
        })
      );

      setSearchResults(resultsWithSelection);

      if (resultsWithSelection.length === 0) {
        setSearchError("No festivals found for this search");
      }
    } catch {
      setSearchError("Search failed. Please try again.");
    } finally {
      setSearching(false);
    }
  }

  async function handleSaveSearch() {
    if (!saveSearchName.trim() || !searchQuery.trim()) return;

    try {
      const res = await fetch("/api/admin/festival-search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: searchQuery,
          saveSearch: true,
          searchName: saveSearchName,
        }),
      });

      if (res.ok) {
        loadSavedSearches();
        setShowSaveDialog(false);
        setSaveSearchName("");
      }
    } catch {
      console.error("Failed to save search");
    }
  }

  async function handleDeleteSearch(id: string) {
    if (!confirm("Delete this saved search?")) return;

    try {
      const res = await fetch(`/api/admin/festival-search?id=${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        loadSavedSearches();
      }
    } catch {
      console.error("Failed to delete search");
    }
  }

  function toggleFestivalSelection(index: number) {
    setSearchResults((prev) =>
      prev.map((f, i) => (i === index ? { ...f, selected: !f.selected } : f))
    );
  }

  function selectAll() {
    setSearchResults((prev) => prev.map((f) => ({ ...f, selected: true })));
  }

  function selectNone() {
    setSearchResults((prev) => prev.map((f) => ({ ...f, selected: false })));
  }

  async function handleImport(publishImmediately: boolean) {
    const selectedFestivals = searchResults.filter((f) => f.selected);
    if (selectedFestivals.length === 0) {
      setImportResult({ success: false, message: "No festivals selected" });
      return;
    }

    setImporting(true);
    setImportResult(null);

    try {
      const res = await fetch("/api/admin/festival-search/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          festivals: selectedFestivals,
          publishImmediately,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setImportResult({ success: false, message: data.error || "Import failed" });
        return;
      }

      setImportResult({ success: true, message: data.message });

      // Remove imported festivals from results
      if (data.results.imported > 0) {
        setSearchResults((prev) => prev.filter((f) => !f.selected));
      }
    } catch {
      setImportResult({ success: false, message: "Import failed" });
    } finally {
      setImporting(false);
    }
  }

  const selectedCount = searchResults.filter((f) => f.selected).length;

  return (
    <div>
      <h1 className="text-dark-text text-2xl font-bold mb-2">Event Sources</h1>
      <p className="text-dark-muted text-sm mb-8">
        Search for festivals and import them as events
      </p>

      {/* Search Section */}
      <div className="bg-dark-surface border border-dark-border p-6 mb-6">
        <h2 className="text-dark-text text-lg font-semibold mb-4">
          🔍 Search Festivals
        </h2>

        <div className="flex gap-3 mb-4">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            placeholder="e.g., Ireland festivals 2026, UK rock festivals, European electronic festivals..."
            className="flex-1 px-4 py-2 bg-dark-bg border border-dark-border text-dark-text placeholder-dark-muted focus:outline-none focus:border-brand transition-colors"
          />
          <button
            onClick={() => handleSearch()}
            disabled={searching || !searchQuery.trim()}
            className="bg-brand hover:bg-brand-hover text-white px-6 py-2 font-medium transition-colors disabled:opacity-50"
          >
            {searching ? "Searching..." : "Search"}
          </button>
        </div>

        {/* Quick search suggestions */}
        <div className="flex flex-wrap gap-2">
          <span className="text-dark-muted text-sm">Quick searches:</span>
          {[
            "Ireland festivals 2026",
            "UK festivals 2026",
            "European rock festivals",
            "Dublin concerts 2026",
          ].map((suggestion) => (
            <button
              key={suggestion}
              onClick={() => {
                setSearchQuery(suggestion);
                handleSearch(suggestion);
              }}
              disabled={searching}
              className="text-sm text-brand hover:text-brand-hover underline disabled:opacity-50"
            >
              {suggestion}
            </button>
          ))}
        </div>
      </div>

      {/* Search Error */}
      {searchError && (
        <div className="mb-6 px-4 py-3 bg-red-900/30 border border-red-800/50 text-red-400 text-sm">
          {searchError}
        </div>
      )}

      {/* Search Results */}
      {searchResults.length > 0 && (
        <div className="bg-dark-surface border border-dark-border p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-dark-text text-lg font-semibold">
              Search Results ({searchResults.length})
            </h2>
            <div className="flex items-center gap-4">
              <div className="flex gap-2 text-sm">
                <button
                  onClick={selectAll}
                  className="text-brand hover:text-brand-hover"
                >
                  Select All
                </button>
                <span className="text-dark-muted">|</span>
                <button
                  onClick={selectNone}
                  className="text-brand hover:text-brand-hover"
                >
                  Select None
                </button>
              </div>
              <button
                onClick={() => setShowSaveDialog(true)}
                className="text-sm text-dark-muted hover:text-dark-text"
              >
                💾 Save Search
              </button>
            </div>
          </div>

          {/* Save Search Dialog */}
          {showSaveDialog && (
            <div className="mb-4 p-4 bg-dark-bg border border-dark-border">
              <div className="flex gap-3">
                <input
                  type="text"
                  value={saveSearchName}
                  onChange={(e) => setSaveSearchName(e.target.value)}
                  placeholder="Name this search..."
                  className="flex-1 px-3 py-2 bg-dark-surface border border-dark-border text-dark-text placeholder-dark-muted text-sm focus:outline-none focus:border-brand"
                />
                <button
                  onClick={handleSaveSearch}
                  disabled={!saveSearchName.trim()}
                  className="bg-brand hover:bg-brand-hover text-white px-4 py-2 text-sm font-medium disabled:opacity-50"
                >
                  Save
                </button>
                <button
                  onClick={() => setShowSaveDialog(false)}
                  className="text-dark-muted hover:text-dark-text px-3"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Results List */}
          <div className="space-y-3 mb-6">
            {searchResults.map((festival, index) => (
              <div
                key={index}
                className={`p-4 border transition-colors cursor-pointer ${
                  festival.selected
                    ? "bg-brand/10 border-brand"
                    : "bg-dark-bg border-dark-border hover:border-dark-muted"
                }`}
                onClick={() => toggleFestivalSelection(index)}
              >
                <div className="flex items-start gap-4">
                  {/* Checkbox */}
                  <div
                    className={`w-5 h-5 border-2 flex items-center justify-center shrink-0 mt-1 ${
                      festival.selected
                        ? "bg-brand border-brand"
                        : "border-dark-border"
                    }`}
                  >
                    {festival.selected && (
                      <svg
                        className="w-3 h-3 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={3}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    )}
                  </div>

                  {/* Festival Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-dark-text font-semibold mb-1">
                      {festival.name}
                    </h3>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-dark-muted mb-2">
                      {(festival.startDate || festival.endDate) && (
                        <span>
                          📅{" "}
                          {festival.startDate
                            ? new Date(festival.startDate).toLocaleDateString(
                                "en-IE",
                                {
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric",
                                }
                              )
                            : "TBA"}
                          {festival.endDate &&
                            festival.endDate !== festival.startDate && (
                              <>
                                {" → "}
                                {new Date(festival.endDate).toLocaleDateString(
                                  "en-IE",
                                  {
                                    day: "numeric",
                                    month: "short",
                                  }
                                )}
                              </>
                            )}
                        </span>
                      )}
                      {(festival.venue || festival.city) && (
                        <span>
                          📍 {[festival.venue, festival.city, festival.country]
                            .filter(Boolean)
                            .join(", ")}
                        </span>
                      )}
                      {festival.genre && <span>🎸 {festival.genre}</span>}
                    </div>
                    {festival.lineup && festival.lineup.length > 0 && (
                      <p className="text-sm text-dark-muted truncate">
                        <span className="text-dark-text">Lineup:</span>{" "}
                        {festival.lineup.slice(0, 5).join(", ")}
                        {festival.lineup.length > 5 && "..."}
                      </p>
                    )}
                    {festival.description && !festival.lineup?.length && (
                      <p className="text-sm text-dark-muted line-clamp-2">
                        {festival.description}
                      </p>
                    )}
                  </div>

                  {/* Links */}
                  <div className="flex gap-2 shrink-0">
                    {festival.websiteUrl && (
                      <a
                        href={festival.websiteUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="text-brand hover:text-brand-hover text-sm"
                        title="Visit website"
                      >
                        🔗
                      </a>
                    )}
                    {festival.ticketUrl && (
                      <a
                        href={festival.ticketUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="text-brand hover:text-brand-hover text-sm"
                        title="Buy tickets"
                      >
                        🎟️
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Import Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-dark-border">
            <p className="text-dark-muted text-sm">
              {selectedCount} of {searchResults.length} selected
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => handleImport(false)}
                disabled={importing || selectedCount === 0}
                className="bg-dark-bg border border-dark-border hover:border-brand text-dark-text px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50"
              >
                {importing ? "Importing..." : "Import as Drafts"}
              </button>
              <button
                onClick={() => handleImport(true)}
                disabled={importing || selectedCount === 0}
                className="bg-brand hover:bg-brand-hover text-white px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50"
              >
                {importing ? "Importing..." : "Import & Publish"}
              </button>
            </div>
          </div>

          {/* Import Result */}
          {importResult && (
            <div
              className={`mt-4 px-4 py-3 text-sm ${
                importResult.success
                  ? "bg-green-900/30 border border-green-800/50 text-green-400"
                  : "bg-red-900/30 border border-red-800/50 text-red-400"
              }`}
            >
              {importResult.message}
            </div>
          )}
        </div>
      )}

      {/* Saved Searches */}
      <div className="bg-dark-surface border border-dark-border p-6">
        <h2 className="text-dark-text text-lg font-semibold mb-4">
          💾 Saved Searches
        </h2>

        {loadingSaved ? (
          <p className="text-dark-muted text-sm">Loading...</p>
        ) : savedSearches.length === 0 ? (
          <p className="text-dark-muted text-sm">
            No saved searches yet. Run a search and save it for quick access.
          </p>
        ) : (
          <div className="space-y-2">
            {savedSearches.map((search) => (
              <div
                key={search.id}
                className="flex items-center justify-between p-3 bg-dark-bg border border-dark-border"
              >
                <div>
                  <p className="text-dark-text font-medium">{search.name}</p>
                  <p className="text-dark-muted text-sm">
                    &quot;{search.searchQuery}&quot;
                    {search.lastSearched && (
                      <span className="ml-2">
                        • Last run:{" "}
                        {new Date(search.lastSearched).toLocaleDateString()}
                        {search.resultsCount !== null &&
                          ` (${search.resultsCount} results)`}
                      </span>
                    )}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setSearchQuery(search.searchQuery);
                      handleSearch(search.searchQuery);
                    }}
                    disabled={searching}
                    className="bg-brand hover:bg-brand-hover text-white px-3 py-1 text-sm font-medium transition-colors disabled:opacity-50"
                  >
                    Run
                  </button>
                  <button
                    onClick={() => handleDeleteSearch(search.id)}
                    className="text-dark-muted hover:text-red-400 px-2 text-sm"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Instructions */}
      <div className="mt-8 p-6 bg-dark-bg border border-dark-border">
        <h3 className="text-dark-text font-semibold mb-3">How it works</h3>
        <ul className="text-dark-muted text-sm space-y-2">
          <li>
            <strong>1. Search:</strong> Enter a search term like &quot;Ireland
            festivals 2026&quot; or &quot;UK rock festivals&quot;
          </li>
          <li>
            <strong>2. Review:</strong> Check the results and select which
            festivals to import
          </li>
          <li>
            <strong>3. Import:</strong> Choose to import as drafts (for review)
            or publish immediately
          </li>
          <li>
            <strong>4. Save:</strong> Save your searches to quickly re-run them
            later
          </li>
        </ul>
        <p className="text-dark-muted text-sm mt-4">
          💡 <strong>Tip:</strong> Imported events go to{" "}
          <a href="/admin/events" className="text-brand hover:underline">
            Admin → Events
          </a>{" "}
          where you can edit details, add images, and feature them.
        </p>
      </div>
    </div>
  );
}
