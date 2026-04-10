import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Metadata } from "next";
import SaveEventButton from "@/components/events/SaveEventButton";

export const revalidate = 60; // Revalidate every 60 seconds

async function getEventDetails(id: string) {
  return prisma.event.findUnique({
    where: { id },
  });
}

async function getOtherVenueEvents(venue: string | null, currentEventId: string) {
  if (!venue) return [];
  
  return prisma.event.findMany({
    where: {
      venue,
      id: { not: currentEventId },
      date: { gte: new Date() },
      active: true,
    },
    orderBy: { date: "asc" },
    take: 6,
  });
}

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const event = await getEventDetails(id);

  if (!event) {
    notFound();
  }

  const otherVenueEvents = await getOtherVenueEvents(event.venue, id);

  const formatDate = (date: string | Date) => {
    const dateObj = typeof date === "string" ? new Date(date) : date;
    return dateObj.toLocaleDateString("en-IE", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const formatTime = (timeStr: string | null) => {
    if (!timeStr) return "TBA";
    try {
      const [hours, minutes] = timeStr.split(":").slice(0, 2);
      return `${hours}:${minutes}`;
    } catch {
      return timeStr;
    }
  };

  return (
    <>
      {/* Header */}
      <section className="bg-dark-bg">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <h1 className="text-white text-3xl md:text-4xl font-bold">{event.name}</h1>
          {event.artist && (
            <p className="text-brand text-lg mt-2">{event.artist}</p>
          )}
        </div>
      </section>

      {/* Main Content */}
      <section className="bg-light-bg">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="md:col-span-2">
              {/* Image */}
              {event.imageUrl && (
                <div className="aspect-video bg-light-surface overflow-hidden rounded-lg mb-8 relative group">
                  <img
                    src={event.imageUrl}
                    alt={event.name}
                    className="w-full h-full object-cover"
                  />
                  {/* Save Button */}
                  <div className="absolute top-4 right-4">
                    <SaveEventButton eventId={event.id} />
                  </div>
                </div>
              )}

              {/* Description */}
              {event.description && (
                <div className="mb-8">
                  <h2 className="text-dark-text text-2xl font-bold mb-4">About this event</h2>
                  <p className="text-light-text whitespace-pre-wrap">{event.description}</p>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div>
              {/* Event Details Card */}
              <div className="bg-white border border-light-border p-6 rounded-lg mb-6">
                <h3 className="text-lg font-bold mb-4 text-gray-900">Event Details</h3>

                {/* Artist */}
                {event.artist && (
                  <div className="mb-4 pb-4 border-b border-light-border">
                    <p className="text-gray-600 text-sm font-medium">Artist</p>
                    <p className="text-gray-900 font-semibold">{event.artist}</p>
                  </div>
                )}

                {/* Artist Social Links */}
                {(event.artistSpotify || event.artistFacebook || event.artistTwitter || event.artistInstagram || event.artistYoutube || event.artistTiktok) && (
                  <div className="mb-4 pb-4 border-b border-light-border">
                    <p className="text-gray-600 text-sm font-medium mb-3">Follow Artist</p>
                    <div className="flex gap-3 flex-wrap">
                      {event.artistSpotify && <a href={event.artistSpotify} target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-[#1DB954] transition-colors" title="Spotify"><svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/></svg></a>}
                      {event.artistInstagram && <a href={event.artistInstagram} target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-[#E4405F] transition-colors" title="Instagram"><svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg></a>}
                      {event.artistFacebook && <a href={event.artistFacebook} target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-[#1877F2] transition-colors" title="Facebook"><svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg></a>}
                      {event.artistTwitter && <a href={event.artistTwitter} target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-black transition-colors" title="X"><svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg></a>}
                      {event.artistYoutube && <a href={event.artistYoutube} target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-[#FF0000] transition-colors" title="YouTube"><svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg></a>}
                      {event.artistTiktok && <a href={event.artistTiktok} target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-black transition-colors" title="TikTok"><svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/></svg></a>}
                    </div>
                  </div>
                )}

                {/* Date & Time */}
                <div className="mb-4 pb-4 border-b border-light-border flex items-start gap-3">
                  <svg className="w-5 h-5 text-brand shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <div>
                    <p className="text-gray-600 text-sm font-medium">Date & Time</p>
                    <p className="text-gray-900 font-semibold">{formatDate(event.date)}</p>
                    <p className="text-gray-800">{formatTime(event.startTime) || "Time TBA"}</p>
                  </div>
                </div>

                {/* Venue */}
                <div className="mb-4 pb-4 border-b border-light-border flex items-start gap-3">
                  <svg className="w-5 h-5 text-brand shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <div>
                    <p className="text-gray-600 text-sm font-medium">Venue</p>
                    <p className="text-gray-900 font-semibold">{event.venue || "Venue not specified"}</p>
                    {event.city && (
                      <p className="text-gray-700 text-sm">
                        {event.city}, {event.country}
                      </p>
                    )}
                  </div>
                </div>

                {/* Type */}
                <div className="mb-4 pb-4 border-b border-light-border">
                  <p className="text-gray-600 text-sm font-medium">Type</p>
                  <p className="text-gray-900 font-semibold capitalize">{event.type || "Event"}</p>
                </div>

                {/* Genre */}
                <div className="mb-4 pb-4 border-b border-light-border">
                  <p className="text-gray-600 text-sm font-medium">Genre</p>
                  <p className="text-gray-900 font-semibold">{event.genre || "Not specified"}</p>
                </div>

                {/* Sub-Genre */}
                {event.subGenre && (
                  <div className="mb-4 pb-4 border-b border-light-border">
                    <p className="text-gray-600 text-sm font-medium">Sub-Genre</p>
                    <p className="text-gray-900 font-semibold">{event.subGenre}</p>
                  </div>
                )}

                {/* Price */}
                {(event.priceMin || event.priceMax) && (
                  <div className="mb-4 pb-4 border-b border-light-border">
                    <p className="text-gray-600 text-sm font-medium">Price</p>
                    <p className="text-gray-900 font-semibold">
                      {event.priceMin && event.priceMax
                        ? `${event.priceCurrency || "€"}${event.priceMin} - ${event.priceCurrency || "€"}${event.priceMax}`
                        : event.priceMin
                        ? `From ${event.priceCurrency || "€"}${event.priceMin}`
                        : `From ${event.priceCurrency || "€"}${event.priceMax}`}
                    </p>
                  </div>
                )}

                {/* Get Tickets */}
                {event.ticketUrl && (
                  <a
                    href={event.ticketUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full bg-brand hover:bg-brand-hover text-white font-semibold py-3 px-4 rounded text-center block transition-colors mb-4"
                  >
                    Get Tickets
                  </a>
                )}

                {/* Share */}
                <div className="pt-4 border-t border-light-border">
                  <p className="text-gray-600 text-sm font-medium mb-3">Share</p>
                  <div className="flex gap-3">
                    <a
                      href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
                        typeof window !== "undefined" ? window.location.href : ""
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-600 hover:text-[#1877F2] transition-colors"
                      title="Share on Facebook"
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                      </svg>
                    </a>
                    <a
                      href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(
                        typeof window !== "undefined" ? window.location.href : ""
                      )}&text=${encodeURIComponent(`Check out: ${event.name}`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-600 hover:text-black transition-colors"
                      title="Share on X"
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                      </svg>
                    </a>
                  </div>
                </div>

              </div>

              {/* Back Button */}
              <Link
                href="/events"
                className="inline-block w-full text-center bg-gray-400 hover:bg-gray-500 text-white font-semibold py-2 px-4 rounded transition-colors"
              >
                ← Back to Events
              </Link>
            </div>
          </div>

          {/* Other Events at Same Venue */}
          {otherVenueEvents.length > 0 && event.venue && (
            <div className="mt-16 pt-12 border-t border-light-border">
              <h2 className="text-gray-900 text-2xl font-bold mb-6">
                Other Events at {event.venue}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {otherVenueEvents.map((venueEvent) => (
                  <Link
                    key={venueEvent.id}
                    href={`/events/${venueEvent.id}`}
                    className="group bg-white border border-light-border hover:border-brand transition-colors overflow-hidden"
                  >
                    <div className="aspect-video bg-light-surface overflow-hidden relative">
                      {venueEvent.imageUrl ? (
                        <img
                          src={venueEvent.imageUrl}
                          alt={venueEvent.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <span className="text-light-muted text-3xl">♪</span>
                        </div>
                      )}
                      {/* Save Button */}
                      <div className="absolute top-2 right-2">
                        <SaveEventButton eventId={venueEvent.id} />
                      </div>
                    </div>
                    <div className="p-4">
                      {venueEvent.artist && (
                        <p className="text-brand text-xs font-semibold uppercase mb-1">
                          {venueEvent.artist}
                        </p>
                      )}
                      <h3 className="font-semibold text-sm group-hover:text-brand transition-colors line-clamp-2 mb-2">
                        {venueEvent.name}
                      </h3>
                      <p className="text-light-muted text-xs">
                        {formatDate(venueEvent.date)}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
