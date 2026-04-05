"use client";

import { useState, useMemo } from "react";
import SaveEventButton from "@/components/events/SaveEventButton";

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

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function EventCalendar({ events }: { events: Event[] }) {
  const now = new Date();
  const [currentMonth, setCurrentMonth] = useState(now.getMonth());
  const [currentYear, setCurrentYear] = useState(now.getFullYear());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const eventsByDate = useMemo(() => {
    const map: Record<string, Event[]> = {};
    events.forEach((e) => {
      const d = new Date(e.date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      if (!map[key]) map[key] = [];
      map[key].push(e);
    });
    return map;
  }, [events]);

  const calendarDays = useMemo(() => {
    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    const startDow = (firstDay.getDay() + 6) % 7; // Monday = 0
    const totalDays = lastDay.getDate();

    const days: { date: number | null; key: string; isToday: boolean }[] = [];

    for (let i = 0; i < startDow; i++) {
      days.push({ date: null, key: `empty-${i}`, isToday: false });
    }

    for (let d = 1; d <= totalDays; d++) {
      const key = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      const isToday = d === now.getDate() && currentMonth === now.getMonth() && currentYear === now.getFullYear();
      days.push({ date: d, key, isToday });
    }

    return days;
  }, [currentMonth, currentYear]);

  const monthLabel = new Date(currentYear, currentMonth).toLocaleDateString("en-IE", {
    month: "long",
    year: "numeric",
  });

  function prevMonth() {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
    setSelectedDate(null);
  }

  function nextMonth() {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
    setSelectedDate(null);
  }

  function goToday() {
    setCurrentMonth(now.getMonth());
    setCurrentYear(now.getFullYear());
    setSelectedDate(null);
  }

  const selectedEvents = selectedDate ? eventsByDate[selectedDate] || [] : [];

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* Calendar Grid */}
      <div className="flex-1">
        {/* Month Navigation */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={prevMonth}
            className="p-2 hover:bg-light-surface rounded transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="flex items-center gap-3">
            <h3 className="text-xl font-bold">{monthLabel}</h3>
            {(currentMonth !== now.getMonth() || currentYear !== now.getFullYear()) && (
              <button
                onClick={goToday}
                className="text-brand text-xs hover:text-brand-hover transition-colors"
              >
                Today
              </button>
            )}
          </div>
          <button
            onClick={nextMonth}
            className="p-2 hover:bg-light-surface rounded transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* Day Headers */}
        <div className="grid grid-cols-7 mb-1">
          {DAYS.map((day) => (
            <div key={day} className="text-center text-xs font-medium text-light-muted py-2">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Cells */}
        <div className="grid grid-cols-7 border border-light-border">
          {calendarDays.map(({ date, key, isToday }) => {
            const dayEvents = date ? eventsByDate[key] || [] : [];
            const hasEvents = dayEvents.length > 0;
            const isSelected = key === selectedDate;
            const isPast = date !== null && new Date(currentYear, currentMonth, date) < new Date(now.getFullYear(), now.getMonth(), now.getDate());

            return (
              <div
                key={key}
                onClick={() => {
                  if (hasEvents) setSelectedDate(isSelected ? null : key);
                }}
                className={`min-h-[80px] sm:min-h-[100px] border-b border-r border-light-border p-1.5 transition-colors ${
                  date === null
                    ? "bg-light-surface/50"
                    : hasEvents
                    ? isSelected
                      ? "bg-brand/10 cursor-pointer"
                      : "hover:bg-light-surface cursor-pointer"
                    : isPast
                    ? "bg-light-surface/30"
                    : ""
                }`}
              >
                {date !== null && (
                  <>
                    <div className={`text-sm font-medium mb-1 ${
                      isToday
                        ? "bg-brand text-white w-6 h-6 rounded-full flex items-center justify-center"
                        : isPast
                        ? "text-light-muted/50"
                        : "text-light-text"
                    }`}>
                      {date}
                    </div>
                    {dayEvents.length > 0 && (
                      <div className="space-y-0.5">
                        {dayEvents.slice(0, 3).map((e) => (
                          <div
                            key={e.id}
                            className={`text-[10px] leading-tight truncate px-1 py-0.5 rounded ${
                              e.type === "FESTIVAL"
                                ? "bg-purple-100 text-purple-700"
                                : "bg-blue-100 text-blue-700"
                            } ${e.featured ? "font-bold" : ""}`}
                          >
                            {e.name}
                          </div>
                        ))}
                        {dayEvents.length > 3 && (
                          <div className="text-[10px] text-light-muted px-1">
                            +{dayEvents.length - 3} more
                          </div>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 mt-3">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-blue-100 border border-blue-200"></div>
            <span className="text-xs text-light-muted">Concert</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-purple-100 border border-purple-200"></div>
            <span className="text-xs text-light-muted">Festival</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-6 h-6 rounded-full bg-brand"></div>
            <span className="text-xs text-light-muted">Today</span>
          </div>
        </div>
      </div>

      {/* Selected Day Detail Panel */}
      <div className="lg:w-96 shrink-0">
        {selectedDate && selectedEvents.length > 0 ? (
          <div>
            <h3 className="text-lg font-bold mb-4">
              {new Date(selectedDate + "T00:00:00").toLocaleDateString("en-IE", {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
              <span className="text-light-muted text-sm font-normal ml-2">
                ({selectedEvents.length} event{selectedEvents.length === 1 ? "" : "s"})
              </span>
            </h3>
            <div className="space-y-4 max-h-[600px] overflow-y-auto">
              {selectedEvents.map((event) => (
                <div key={event.id} className="bg-white border border-light-border p-4 hover:border-brand transition-colors">
                  {event.imageUrl && (
                    <div className="aspect-video bg-light-surface overflow-hidden mb-3 relative">
                      <img src={event.imageUrl} alt={event.name} className="w-full h-full object-cover" />
                      <div className="absolute top-2 right-2">
                        <SaveEventButton eventId={event.id} />
                      </div>
                    </div>
                  )}
                  <h4 className="font-bold">{event.name}</h4>
                  {event.artist && event.artist !== event.name && (
                    <p className="text-light-muted text-sm">{event.artist}</p>
                  )}
                  {event.description && (
                    <p className="text-light-muted text-sm mt-1 line-clamp-2">{event.description}</p>
                  )}
                  <div className="mt-2 space-y-1 text-sm">
                    {formatTime(event.startTime) && (
                      <p className="text-light-muted">
                        <span className="text-brand font-medium">{formatTime(event.startTime)}</span>
                      </p>
                    )}
                    <p className="text-light-muted">
                      {[event.venue, event.city, event.country].filter(Boolean).join(", ")}
                    </p>
                    {formatPrice(event) && (
                      <p className="text-light-muted">{formatPrice(event)}</p>
                    )}
                    {(event.genre || event.subGenre) && (
                      <div className="flex gap-1 flex-wrap">
                        {event.genre && <span className="text-xs bg-light-surface text-light-muted px-2 py-0.5 rounded">{event.genre}</span>}
                        {event.subGenre && event.subGenre !== event.genre && <span className="text-xs bg-light-surface text-light-muted px-2 py-0.5 rounded">{event.subGenre}</span>}
                      </div>
                    )}
                  </div>
                  {event.ticketUrl && (
                    <div className="mt-3">
                      <span dangerouslySetInnerHTML={{
                        __html: `<a href="${event.ticketUrl}" target="_blank" rel="noopener noreferrer" class="inline-block w-full text-center bg-brand hover:bg-brand-hover text-white px-4 py-2 text-sm font-medium transition-colors">Get Tickets \u2192</a>`,
                      }} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="bg-light-surface border border-light-border rounded p-8 text-center">
            <svg className="w-10 h-10 text-light-muted mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="text-light-muted text-sm">Click a day with events to see details</p>
          </div>
        )}
      </div>
    </div>
  );
}
