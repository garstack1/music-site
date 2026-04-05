"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
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

interface VenueGroup {
  key: string;
  lat: number;
  lng: number;
  venue: string | null;
  city: string | null;
  events: Event[];
}

function MiniCard({ event, selected, onClick }: { event: Event; selected: boolean; onClick: () => void }) {
  return (
    <div
      onClick={onClick}
      className={`flex gap-3 p-3 cursor-pointer transition-colors border-b border-light-border ${
        selected ? "bg-brand/5 border-l-2 border-l-brand" : "hover:bg-light-surface border-l-2 border-l-transparent"
      }`}
    >
      {event.imageUrl && (
        <div className="w-16 h-16 shrink-0 bg-light-surface overflow-hidden rounded">
          <img src={event.imageUrl} alt="" className="w-full h-full object-cover" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <h4 className="font-semibold text-sm leading-tight truncate">{event.name}</h4>
        {event.artist && event.artist !== event.name && (
          <p className="text-light-muted text-xs truncate">{event.artist}</p>
        )}
        <p className="text-light-muted text-xs mt-0.5">
          {new Date(event.date).toLocaleDateString("en-IE", { day: "numeric", month: "short" })}
          {formatTime(event.startTime) && ` · ${formatTime(event.startTime)}`}
        </p>
        <p className="text-light-muted text-xs truncate">
          {[event.venue, event.city].filter(Boolean).join(", ")}
        </p>
      </div>
      <div className="shrink-0 flex flex-col items-end gap-1">
        <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${
          event.type === "FESTIVAL" ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700"
        }`}>{event.type}</span>
        {event.genre && (
          <span className="text-[10px] text-light-muted">{event.genre}</span>
        )}
      </div>
    </div>
  );
}

function EventDetail({ event }: { event: Event }) {
  const price = formatPrice(event);
  const time = formatTime(event.startTime);

  return (
    <div className="bg-white border-b border-light-border">
      {event.imageUrl && (
        <div className="aspect-video bg-light-surface overflow-hidden relative">
          <img src={event.imageUrl} alt={event.name} className="w-full h-full object-cover" />
          <div className="absolute top-2 right-2"><SaveEventButton eventId={event.id} /></div>
          <div className="absolute top-2 left-2">
            <span className={`text-xs font-medium px-2 py-0.5 rounded ${
              event.type === "FESTIVAL" ? "bg-purple-600 text-white" : "bg-blue-600 text-white"
            }`}>{event.type}</span>
          </div>
        </div>
      )}
      <div className="p-4">
        <h3 className="font-bold text-lg">{event.name}</h3>
        {event.artist && event.artist !== event.name && (
          <p className="text-light-muted text-sm">{event.artist}</p>
        )}
        {event.description && (
          <p className="text-light-muted text-sm mt-2 line-clamp-3">{event.description}</p>
        )}
        <div className="mt-3 space-y-1.5 text-sm">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-brand shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span>
              {new Date(event.date).toLocaleDateString("en-IE", { weekday: "short", day: "numeric", month: "short", year: "numeric" })}
              {time && <span className="text-light-muted"> at {time}</span>}
            </span>
          </div>
          {price && (
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-brand shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
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
        {event.ticketUrl && (
          <div className="mt-4">
            <span dangerouslySetInnerHTML={{
              __html: `<a href="${event.ticketUrl}" target="_blank" rel="noopener noreferrer" class="inline-block w-full text-center bg-brand hover:bg-brand-hover text-white px-4 py-2.5 text-sm font-medium tracking-wide transition-colors">Get Tickets \u2192</a>`,
            }} />
          </div>
        )}
      </div>
    </div>
  );
}

function MapBoundsUpdater({ onBoundsChange }: { onBoundsChange: (bounds: any) => void }) {
  const [mod, setMod] = useState<any>(null);
  useEffect(() => { import("react-leaflet").then((m) => setMod(m)); }, []);
  if (!mod) return null;
  return <MapBoundsInner useMapEvents={mod.useMapEvents} onBoundsChange={onBoundsChange} />;
}

function MapBoundsInner({ useMapEvents, onBoundsChange }: { useMapEvents: any; onBoundsChange: (bounds: any) => void }) {
  useMapEvents({
    moveend: (e: any) => onBoundsChange(e.target.getBounds()),
    zoomend: (e: any) => onBoundsChange(e.target.getBounds()),
  });
  return null;
}

function FlyToEvent({ lat, lng }: { lat: number; lng: number }) {
  const [mod, setMod] = useState<any>(null);
  useEffect(() => { import("react-leaflet").then((m) => setMod(m)); }, []);
  if (!mod) return null;
  return <FlyToInner useMap={mod.useMap} lat={lat} lng={lng} />;
}

function FlyToInner({ useMap, lat, lng }: { useMap: any; lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    if (lat && lng) map.flyTo([lat, lng], Math.max(map.getZoom(), 10), { duration: 0.5 });
  }, [lat, lng, map]);
  return null;
}

export default function EventMap({ events }: { events: Event[] }) {
  const [MapComponents, setMapComponents] = useState<any>(null);
  const [selectedVenue, setSelectedVenue] = useState<VenueGroup | null>(null);
  const [bounds, setBounds] = useState<any>(null);
  const [visibleCount, setVisibleCount] = useState(20);
  const [flyTo, setFlyTo] = useState<{ lat: number; lng: number } | null>(null);

  const mappableEvents = events.filter((e) => e.latitude && e.longitude);

  // Group events by venue (same lat/lng rounded to 4 decimals)
  const venueGroups = useMemo(() => {
    const groups: Record<string, VenueGroup> = {};
    mappableEvents.forEach((e) => {
      const key = `${e.latitude!.toFixed(4)},${e.longitude!.toFixed(4)}`;
      if (!groups[key]) {
        groups[key] = {
          key,
          lat: e.latitude!,
          lng: e.longitude!,
          venue: e.venue,
          city: e.city,
          events: [],
        };
      }
      groups[key].events.push(e);
    });
    // Sort events within each group by date
    Object.values(groups).forEach((g) => {
      g.events.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    });
    return Object.values(groups);
  }, [mappableEvents]);

  const visibleEvents = bounds
    ? mappableEvents.filter((e) => e.latitude && e.longitude && bounds.contains([e.latitude, e.longitude]))
    : mappableEvents;

  const sortedVisible = visibleEvents.sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  const displayedEvents = sortedVisible.slice(0, visibleCount);
  const hasMore = sortedVisible.length > visibleCount;

  useEffect(() => {
    import("react-leaflet").then((mod) => setMapComponents(mod));
    if (!document.getElementById("leaflet-css")) {
      const link = document.createElement("link");
      link.id = "leaflet-css";
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);
    }
  }, []);

  useEffect(() => {
    import("leaflet").then((L) => {
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });
    });
  }, []);

  const handleBoundsChange = useCallback((newBounds: any) => {
    setBounds(newBounds);
    setVisibleCount(20);
  }, []);

  function handleSelectVenue(group: VenueGroup) {
    setSelectedVenue(group);
    setFlyTo({ lat: group.lat, lng: group.lng });
  }

  function handleSelectEventFromList(event: Event) {
    // Find the venue group this event belongs to
    const key = `${event.latitude!.toFixed(4)},${event.longitude!.toFixed(4)}`;
    const group = venueGroups.find((g) => g.key === key);
    if (group) {
      setSelectedVenue(group);
      setFlyTo({ lat: group.lat, lng: group.lng });
    }
  }

  if (!MapComponents) {
    return (
      <div className="flex items-center justify-center h-[600px] bg-light-surface border border-light-border">
        <p className="text-light-muted text-sm">Loading map...</p>
      </div>
    );
  }

  if (mappableEvents.length === 0) {
    return (
      <div className="flex items-center justify-center h-[400px] bg-light-surface border border-light-border">
        <p className="text-light-muted text-sm">No events with location data to display.</p>
      </div>
    );
  }

  const { MapContainer, TileLayer, CircleMarker, Popup } = MapComponents;
  const center: [number, number] = [53.3, -7.5];

  return (
    <div className="flex flex-col lg:flex-row gap-0 border border-light-border rounded overflow-hidden">
      {/* Map */}
      <div className="flex-1 min-h-[400px] lg:min-h-[700px]">
        <MapContainer center={center} zoom={6} style={{ height: "100%", width: "100%", minHeight: "400px" }} className="z-0">
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapBoundsUpdater onBoundsChange={handleBoundsChange} />
          {flyTo && <FlyToEvent lat={flyTo.lat} lng={flyTo.lng} />}
          {venueGroups.map((group) => {
            const isSelected = selectedVenue?.key === group.key;
            const hasFestival = group.events.some((e) => e.type === "FESTIVAL");
            const count = group.events.length;

            return (
              <CircleMarker
                key={group.key}
                center={[group.lat, group.lng]}
                radius={isSelected ? 14 : Math.min(6 + count * 2, 16)}
                pathOptions={{
                  color: isSelected ? "#DC2626" : hasFestival ? "#9333ea" : "#2563eb",
                  fillColor: isSelected ? "#DC2626" : hasFestival ? "#a855f7" : "#3b82f6",
                  fillOpacity: isSelected ? 1 : 0.7,
                  weight: isSelected ? 3 : 2,
                }}
                eventHandlers={{
                  click: () => handleSelectVenue(group),
                }}
              >
                <Popup>
                  <div className="min-w-[180px]">
                    <p className="font-bold text-sm">{group.venue || "Unknown Venue"}</p>
                    <p className="text-gray-500 text-xs">{group.city}</p>
                    <p className="text-gray-600 text-xs mt-1 font-medium">{count} event{count === 1 ? "" : "s"}</p>
                  </div>
                </Popup>
              </CircleMarker>
            );
          })}
        </MapContainer>
      </div>

      {/* Side Panel */}
      <div className="lg:w-96 shrink-0 bg-white border-l border-light-border flex flex-col max-h-[700px]">
        {/* Header */}
        <div className="px-4 py-3 border-b border-light-border bg-light-surface shrink-0">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">
              {sortedVisible.length} event{sortedVisible.length === 1 ? "" : "s"} in view
            </span>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <div className="w-2.5 h-2.5 rounded-full bg-blue-500"></div>
                <span className="text-[10px] text-light-muted">Concert</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2.5 h-2.5 rounded-full bg-purple-500"></div>
                <span className="text-[10px] text-light-muted">Festival</span>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {selectedVenue ? (
            <div>
              {/* Venue Header */}
              <div className="flex items-center justify-between px-4 py-3 bg-light-surface border-b border-light-border sticky top-0 z-10">
                <div>
                  <p className="font-semibold text-sm">{selectedVenue.venue || "Unknown Venue"}</p>
                  <p className="text-light-muted text-xs">{selectedVenue.city} · {selectedVenue.events.length} event{selectedVenue.events.length === 1 ? "" : "s"}</p>
                </div>
                <button onClick={() => setSelectedVenue(null)} className="text-light-muted hover:text-light-text transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              {/* Events at this venue */}
              {selectedVenue.events.map((event) => (
                <EventDetail key={event.id} event={event} />
              ))}
            </div>
          ) : sortedVisible.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-light-muted text-sm">No events in this area.</p>
              <p className="text-light-muted text-xs mt-1">Zoom out or pan to see more events.</p>
            </div>
          ) : (
            <>
              {displayedEvents.map((event) => (
                <MiniCard
                  key={event.id}
                  event={event}
                  selected={false}
                  onClick={() => handleSelectEventFromList(event)}
                />
              ))}
              {hasMore && (
                <div className="p-3 text-center border-t border-light-border">
                  <button
                    onClick={() => setVisibleCount((c) => c + 20)}
                    className="text-brand hover:text-brand-hover text-sm font-medium transition-colors"
                  >
                    Load more ({sortedVisible.length - visibleCount} remaining)
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
