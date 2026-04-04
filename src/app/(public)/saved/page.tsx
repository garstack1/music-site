"use client";

import { useState, useEffect } from "react";
import { useSavedEvents } from "@/hooks/useSavedEvents";

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
  ticketUrl: string | null;
  genre: string | null;
}

export default function SavedEventsPage() {
  const { savedIds, loaded, unsave } = useSavedEvents();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!loaded) return;

    if (savedIds.length === 0) {
      setEvents([]);
      setLoading(false);
      return;
    }

    fetch(`/api/events/saved?ids=${savedIds.join(",")}`)
      .then((r) => r.json())
      .then((data) => setEvents(data.events || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [savedIds, loaded]);

  const upcoming = events
    .filter((e) => new Date(e.date) >= new Date())
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const past = events
    .filter((e) => new Date(e.date) < new Date())
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <>
      <section className="bg-dark-bg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <h1 className="text-dark-text text-3xl md:text-4xl font-bold">Saved Events</h1>
          <p className="text-dark-muted mt-2">
            Your saved concerts and festivals. Stored in your browser — no account needed.
          </p>
        </div>
      </section>

      <section className="bg-light-bg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {loading || !loaded ? (
            <p className="text-light-muted text-sm">Loading saved events...</p>
          ) : events.length === 0 ? (
            <div className="text-center py-16">
              <svg className="w-12 h-12 text-light-muted mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              <p className="text-light-muted text-sm">No saved events yet.</p>
              <p className="text-light-muted text-xs mt-1">
                Click the heart icon on any event to save it here.
              </p>
            </div>
          ) : (
            <>
              {/* Upcoming */}
              {upcoming.length > 0 && (
                <div className="mb-10">
                  <h2 className="text-xl font-bold mb-4">
                    <span className="text-brand">Upcoming</span> ({upcoming.length})
                  </h2>
                  <div className="space-y-4">
                    {upcoming.map((event) => (
                      <div
                        key={event.id}
                        className="flex items-center gap-6 border-b border-light-border pb-4"
                      >
                        <div className="text-center w-16 shrink-0">
                          <div className="text-2xl font-bold text-brand">
                            {new Date(event.date).getDate()}
                          </div>
                          <div className="text-xs text-light-muted uppercase">
                            {new Date(event.date).toLocaleDateString("en-IE", { month: "short" })}
                          </div>
                        </div>

                        <div className="flex-1">
                          <h3 className="font-semibold">{event.name}</h3>
                          <p className="text-light-muted text-sm">
                            {[event.venue, event.city, event.country].filter(Boolean).join(", ")}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={`text-xs font-medium px-2 py-0.5 rounded ${
                              event.type === "FESTIVAL"
                                ? "bg-purple-100 text-purple-700"
                                : "bg-blue-100 text-blue-700"
                            }`}>
                              {event.type}
                            </span>
                            {event.genre && (
                              <span className="text-xs bg-light-surface text-light-muted px-2 py-0.5">
                                {event.genre}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {event.ticketUrl && (
                            <span
                              dangerouslySetInnerHTML={{
                                __html: `<a href="${event.ticketUrl}" target="_blank" rel="noopener noreferrer" class="bg-brand hover:bg-brand-hover text-white px-4 py-2 text-xs font-medium tracking-wide transition-colors hidden sm:block">Tickets →</a>`,
                              }}
                            />
                          )}
                          <button
                            onClick={() => unsave(event.id)}
                            title="Remove from saved"
                            className="p-1.5 text-brand hover:text-brand-hover transition-colors"
                          >
                            <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Past */}
              {past.length > 0 && (
                <div>
                  <h2 className="text-xl font-bold mb-4 text-light-muted">Past ({past.length})</h2>
                  <div className="space-y-4 opacity-60">
                    {past.map((event) => (
                      <div
                        key={event.id}
                        className="flex items-center gap-6 border-b border-light-border pb-4"
                      >
                        <div className="text-center w-16 shrink-0">
                          <div className="text-2xl font-bold text-light-muted">
                            {new Date(event.date).getDate()}
                          </div>
                          <div className="text-xs text-light-muted uppercase">
                            {new Date(event.date).toLocaleDateString("en-IE", { month: "short" })}
                          </div>
                        </div>

                        <div className="flex-1">
                          <h3 className="font-semibold text-light-muted">{event.name}</h3>
                          <p className="text-light-muted text-sm">
                            {[event.venue, event.city, event.country].filter(Boolean).join(", ")}
                          </p>
                        </div>

                        <button
                          onClick={() => unsave(event.id)}
                          title="Remove from saved"
                          className="p-1.5 text-light-muted hover:text-brand transition-colors shrink-0"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </>
  );
}
