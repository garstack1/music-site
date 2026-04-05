"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import SaveEventButton from "@/components/events/SaveEventButton";
import EventCalendar from "@/components/events/EventCalendar";
import dynamic from "next/dynamic";

const EventMap = dynamic(() => import("@/components/events/EventMap"), { ssr: false });

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
  description: string | null;
  imageUrl: string | null;
  genre: string | null;
  subGenre: string | null;
  startTime: string | null;
  priceMin: number | null;
  priceMax: number | null;
  priceCurrency: string | null;
  featured: boolean;
  latitude: number | null;
  longitude: number | null;
}

function formatTime(time: string | null): string | null {
  if (!time) return null;
  const [h, m] = time.split(":");
  const hour = parseInt(h);
  const ampm = hour >= 12 ? "PM" : "AM";
  const h12 = hour % 12 || 12;
  return `${h12}:${m} ${ampm}`;
}

function formatPrice(event: Event): string | null {
  if (!event.priceMin && !event.priceMax) return null;
  const currency = event.priceCurrency === "EUR" ? "\u20AC" : event.priceCurrency === "GBP" ? "\u00A3" : event.priceCurrency || "\u20AC";
  if (event.priceMin && event.priceMax && event.priceMin !== event.priceMax) {
    return `${currency}${event.priceMin.toFixed(2)} - ${currency}${event.priceMax.toFixed(2)}`;
  }
  return `${currency}${(event.priceMin || event.priceMax || 0).toFixed(2)}`;
}

function ShareButtons({ event }: { event: Event }) {
  const url = typeof window !== "undefined" ? window.location.origin + "/events" : "";
  const text = `Check out ${event.name}${event.venue ? " at " + event.venue : ""} on ${new Date(event.date).toLocaleDateString("en-IE", { day: "numeric", month: "long", year: "numeric" })}`;
  const encoded = encodeURIComponent(text + " " + url);
  const encodedUrl = encodeURIComponent(url);
  const encodedText = encodeURIComponent(text);

  return (
    <div className="flex items-center gap-2 mt-3">
      <span className="text-light-muted text-xs mr-1">Share:</span>
      <a href={`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encodedText}`} target="_blank" rel="noopener noreferrer" className="text-light-muted hover:text-[#1877F2] transition-colors" title="Facebook">
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
      </a>
      <a href={`https://twitter.com/intent/tweet?text=${encoded}`} target="_blank" rel="noopener noreferrer" className="text-light-muted hover:text-black transition-colors" title="X">
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
      </a>
      <a href={`https://wa.me/?text=${encoded}`} target="_blank" rel="noopener noreferrer" className="text-light-muted hover:text-[#25D366] transition-colors" title="WhatsApp">
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
      </a>
      <a href={`https://bsky.app/intent/compose?text=${encoded}`} target="_blank" rel="noopener noreferrer" className="text-light-muted hover:text-[#0085FF] transition-colors" title="Bluesky">
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 10.8c-1.087-2.114-4.046-6.053-6.798-7.995C2.566.944 1.561 1.266.902 1.565.139 1.908 0 3.08 0 3.768c0 .69.378 5.65.624 6.479.785 2.627 3.6 3.476 6.158 3.181-4.515.538-8.183 2.354-4.91 8.572.018.019 1.81-4.578 7.128-4.578h2c5.318 0 7.11 4.597 7.128 4.578 3.273-6.218-.395-8.034-4.91-8.572 2.558.295 5.374-.554 6.158-3.181.246-.828.624-5.789.624-6.479 0-.688-.139-1.86-.902-2.203-.659-.3-1.664-.62-4.3 1.24C12.046 4.747 9.087 8.686 12 10.8z"/></svg>
      </a>
    </div>
  );
}

function Carousel({ events }: { events: Event[] }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  function checkScroll() {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 10);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 10);
  }

  function scroll(dir: "left" | "right") {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ left: dir === "left" ? -el.clientWidth * 0.8 : el.clientWidth * 0.8, behavior: "smooth" });
  }

  useEffect(() => {
    checkScroll();
    const el = scrollRef.current;
    if (el) el.addEventListener("scroll", checkScroll);
    return () => { if (el) el.removeEventListener("scroll", checkScroll); };
  }, [events]);

  return (
    <div className="relative">
      {canScrollLeft && (
        <button onClick={() => scroll("left")} className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white/90 border border-light-border shadow-md rounded-full w-10 h-10 flex items-center justify-center hover:bg-brand hover:text-white hover:border-brand transition-colors -ml-3">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
        </button>
      )}
      {canScrollRight && (
        <button onClick={() => scroll("right")} className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white/90 border border-light-border shadow-md rounded-full w-10 h-10 flex items-center justify-center hover:bg-brand hover:text-white hover:border-brand transition-colors -mr-3">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
        </button>
      )}
      <div ref={scrollRef} className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-2" style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}>
        {events.map((event) => (
          <div key={event.id} className="snap-start shrink-0 w-[calc(33.333%-11px)] min-w-[280px]">
            <EventCard event={event} />
          </div>
        ))}
      </div>
    </div>
  );
}

function MonthGroup({ month, events, defaultOpen }: { month: string; events: Event[]; defaultOpen: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  const [y, m] = month.split("-");
  const label = new Date(parseInt(y), parseInt(m) - 1).toLocaleDateString("en-IE", { month: "long", year: "numeric" });

  return (
    <div className="mb-6">
      <button onClick={() => setOpen(!open)} className="flex items-center gap-3 w-full text-left mb-4 group">
        <svg className={`w-4 h-4 text-brand transition-transform ${open ? "rotate-90" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
        <h3 className="text-lg font-bold group-hover:text-brand transition-colors">{label}</h3>
        <span className="text-light-muted text-sm">({events.length})</span>
      </button>
      {open && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event) => <EventCard key={event.id} event={event} />)}
        </div>
      )}
    </div>
  );
}

function EventCard({ event }: { event: Event }) {
  const price = formatPrice(event);
  const time = formatTime(event.startTime);

  return (
    <div className="bg-white border border-light-border hover:border-brand transition-colors overflow-hidden flex flex-col">
      {event.imageUrl && (
        <div className="aspect-video bg-light-surface overflow-hidden relative">
          <img src={event.imageUrl} alt={event.name} className="w-full h-full object-cover" />
          <div className="absolute top-2 right-2"><SaveEventButton eventId={event.id} /></div>
          <div className="absolute top-2 left-2">
            <span className={`text-xs font-medium px-2 py-0.5 rounded ${event.type === "FESTIVAL" ? "bg-purple-600 text-white" : "bg-blue-600 text-white"}`}>{event.type}</span>
          </div>
        </div>
      )}
      <div className="p-4 flex-1 flex flex-col">
        <h3 className="font-bold text-lg leading-tight">{event.name}</h3>
        {event.artist && event.artist !== event.name && <p className="text-light-muted text-sm mt-1">{event.artist}</p>}
        {event.description && <p className="text-light-muted text-sm mt-2 line-clamp-2">{event.description}</p>}
        <div className="mt-3 space-y-1.5 text-sm">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-brand shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
            <span>
              {new Date(event.date).toLocaleDateString("en-IE", { weekday: "short", day: "numeric", month: "short", year: "numeric" })}
              {event.endDate && <span className="text-light-muted">{" \u2014 "}{new Date(event.endDate).toLocaleDateString("en-IE", { day: "numeric", month: "short" })}</span>}
              {time && <span className="text-light-muted"> at {time}</span>}
            </span>
          </div>
          {(event.venue || event.city) && (
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-brand shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
              <span className="text-light-muted">{[event.venue, event.city, event.country].filter(Boolean).join(", ")}</span>
            </div>
          )}
          {price && (
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-brand shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              <span className="text-light-muted">{price}</span>
            </div>
          )}
          {(event.genre || event.subGenre) && (
            <div className="flex items-center gap-2 flex-wrap">
              {event.genre && <span className="text-xs bg-light-surface text-light-muted px-2 py-0.5 rounded">{event.genre}</span>}
              {event.subGenre && event.subGenre !== event.genre && <span className="text-xs bg-light-surface text-light-muted px-2 py-0.5 rounded">{event.subGenre}</span>}
            </div>
          )}
        </div>
        <div className="mt-auto pt-4">
          {event.ticketUrl && (
            <span dangerouslySetInnerHTML={{
              __html: `<a href="${event.ticketUrl}" target="_blank" rel="noopener noreferrer" class="inline-block w-full text-center bg-brand hover:bg-brand-hover text-white px-4 py-2.5 text-sm font-medium tracking-wide transition-colors">Get Tickets \u2192</a>`,
            }} />
          )}
          <ShareButtons event={event} />
        </div>
      </div>
    </div>
  );
}

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [genres, setGenres] = useState<string[]>([]);
  const [cities, setCities] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedGenre, setSelectedGenre] = useState("all");
  const [selectedMonth, setSelectedMonth] = useState("all");
  const [selectedCity, setSelectedCity] = useState("all");
  const [selectedTab, setSelectedTab] = useState("all");
  const [view, setView] = useState<"cards" | "calendar" | "map">("cards");

  useEffect(() => {
    fetch("/api/events")
      .then((r) => r.json())
      .then((data) => {
        setEvents(data.events || []);
        setGenres(data.genres || []);
        setCities(data.cities || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const now = new Date();
  const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  const featuredEvents = useMemo(() => events.filter((e) => e.featured).slice(0, 10), [events]);
  const thisWeekEvents = useMemo(() => events.filter((e) => new Date(e.date) >= now && new Date(e.date) <= nextWeek), [events]);

  const months = useMemo(() => {
    const m = new Set<string>();
    events.forEach((e) => {
      const d = new Date(e.date);
      m.add(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
    });
    return [...m].sort();
  }, [events]);

  const filtered = useMemo(() => {
    return events.filter((e) => {
      if (selectedTab === "concerts" && e.type !== "CONCERT") return false;
      if (selectedTab === "festivals" && e.type !== "FESTIVAL") return false;
      if (selectedGenre !== "all" && e.genre !== selectedGenre) return false;
      if (selectedMonth !== "all") {
        const d = new Date(e.date);
        const m = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        if (m !== selectedMonth) return false;
      }
      if (selectedCity !== "all" && e.city !== selectedCity) return false;
      return true;
    });
  }, [events, selectedTab, selectedGenre, selectedMonth, selectedCity]);

  const groupedByMonth = useMemo(() => {
    const groups: Record<string, Event[]> = {};
    filtered.forEach((e) => {
      const d = new Date(e.date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      if (!groups[key]) groups[key] = [];
      groups[key].push(e);
    });
    return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
  }, [filtered]);

  const hasActiveFilters = selectedGenre !== "all" || selectedMonth !== "all" || selectedCity !== "all";

  if (loading) {
    return (
      <section className="bg-dark-bg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <h1 className="text-dark-text text-3xl md:text-4xl font-bold">Events</h1>
          <p className="text-dark-muted mt-2">Loading events...</p>
        </div>
      </section>
    );
  }

  return (
    <>
      <section className="bg-dark-bg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-dark-text text-3xl md:text-4xl font-bold">Events</h1>
              <p className="text-dark-muted mt-2">Upcoming concerts and festivals across Ireland, the UK and Europe.</p>
            </div>
            {/* View Toggle */}
            <div className="flex bg-dark-surface border border-dark-border rounded overflow-hidden">
              <button
                onClick={() => setView("cards")}
                className={`px-3 py-2 text-sm transition-colors ${view === "cards" ? "bg-brand text-white" : "text-dark-muted hover:text-dark-text"}`}
                title="Card View"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
              </button>
              <button
                onClick={() => setView("calendar")}
                className={`px-3 py-2 text-sm transition-colors ${view === "calendar" ? "bg-brand text-white" : "text-dark-muted hover:text-dark-text"}`}
                title="Calendar View"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </button>
              <button
                onClick={() => setView("map")}
                className={`px-3 py-2 text-sm transition-colors ${view === "map" ? "bg-brand text-white" : "text-dark-muted hover:text-dark-text"}`}
                title="Map View"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>
            </div>
          </div>

          <div className="flex gap-4 mt-6 mb-6">
            {[
              { key: "all", label: `All (${events.length})` },
              { key: "concerts", label: `Concerts (${events.filter((e) => e.type === "CONCERT").length})` },
              { key: "festivals", label: `Festivals (${events.filter((e) => e.type === "FESTIVAL").length})` },
            ].map((tab) => (
              <button key={tab.key} onClick={() => setSelectedTab(tab.key)} className={`text-sm pb-2 transition-colors ${selectedTab === tab.key ? "text-dark-text border-b-2 border-brand" : "text-dark-muted hover:text-dark-text"}`}>
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap gap-3">
            <select value={selectedGenre} onChange={(e) => setSelectedGenre(e.target.value)} className="px-3 py-1.5 bg-dark-surface border border-dark-border text-dark-text text-sm focus:outline-none focus:border-brand transition-colors">
              <option value="all">All Genres</option>
              {genres.sort().map((g) => <option key={g} value={g}>{g}</option>)}
            </select>
            <select value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} className="px-3 py-1.5 bg-dark-surface border border-dark-border text-dark-text text-sm focus:outline-none focus:border-brand transition-colors">
              <option value="all">All Months</option>
              {months.map((m) => {
                const [y, mo] = m.split("-");
                const label = new Date(parseInt(y), parseInt(mo) - 1).toLocaleDateString("en-IE", { month: "long", year: "numeric" });
                return <option key={m} value={m}>{label}</option>;
              })}
            </select>
            {(selectedTab === "all" || selectedTab === "concerts") && (
              <select value={selectedCity} onChange={(e) => setSelectedCity(e.target.value)} className="px-3 py-1.5 bg-dark-surface border border-dark-border text-dark-text text-sm focus:outline-none focus:border-brand transition-colors">
                <option value="all">All Cities</option>
                {cities.sort().map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            )}
            {hasActiveFilters && (
              <button onClick={() => { setSelectedGenre("all"); setSelectedMonth("all"); setSelectedCity("all"); }} className="text-brand hover:text-brand-hover text-sm transition-colors">Clear filters</button>
            )}
          </div>
        </div>
      </section>

      {view === "map" ? (
        <section className="bg-light-bg">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <EventMap events={filtered} />
          </div>
        </section>
      ) : view === "calendar" ? (
        <section className="bg-light-bg">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <EventCalendar events={filtered} />
          </div>
        </section>
      ) : (
        <>
          {featuredEvents.length > 0 && !hasActiveFilters && (
            <section className="bg-light-surface border-b border-light-border">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <h2 className="text-xl font-bold mb-4"><span className="text-brand">Featured</span> Events</h2>
                <Carousel events={featuredEvents} />
              </div>
            </section>
          )}

          {thisWeekEvents.length > 0 && !hasActiveFilters && (
            <section className="bg-light-bg border-b border-light-border">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <h2 className="text-xl font-bold mb-4"><span className="text-brand">This Week</span> ({thisWeekEvents.length})</h2>
                <Carousel events={thisWeekEvents} />
              </div>
            </section>
          )}

          <section className="bg-light-bg">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
              {filtered.length === 0 ? (
                <div className="text-center py-12"><p className="text-light-muted">No events match your filters.</p></div>
              ) : (
                groupedByMonth.map(([month, monthEvents]) => (
                  <MonthGroup key={month} month={month} events={monthEvents} defaultOpen={month === currentMonthKey || hasActiveFilters} />
                ))
              )}
            </div>
          </section>
        </>
      )}
    </>
  );
}
