import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Metadata } from "next";

export const revalidate = 60; // Revalidate every 60 seconds

async function getEventDetails(id: string) {
  return prisma.event.findUnique({
    where: { id },
    include: {
      tickets: {
        select: {
          url: true,
          name: true,
        },
        take: 5,
      },
    },
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

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-IE", {
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
                <div className="aspect-video bg-light-surface overflow-hidden rounded-lg mb-8">
                  <img
                    src={event.imageUrl}
                    alt={event.name}
                    className="w-full h-full object-cover"
                  />
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
                <h3 className="text-lg font-bold mb-4">Event Details</h3>

                {/* Date & Time */}
                <div className="mb-4">
                  <p className="text-light-muted text-sm font-medium">Date & Time</p>
                  <p className="text-dark-text font-semibold">{formatDate(event.date)}</p>
                  <p className="text-dark-text">{formatTime(event.startTime)}</p>
                </div>

                {/* Type */}
                {event.type && (
                  <div className="mb-4 pb-4 border-b border-light-border">
                    <p className="text-light-muted text-sm font-medium">Type</p>
                    <p className="text-dark-text font-semibold capitalize">{event.type}</p>
                  </div>
                )}

                {/* Genre */}
                {event.genre && (
                  <div className="mb-4 pb-4 border-b border-light-border">
                    <p className="text-light-muted text-sm font-medium">Genre</p>
                    <p className="text-dark-text font-semibold">{event.genre}</p>
                  </div>
                )}

                {/* Venue */}
                {event.venue && (
                  <div className="mb-4 pb-4 border-b border-light-border">
                    <p className="text-light-muted text-sm font-medium">Venue</p>
                    <p className="text-dark-text font-semibold">{event.venue}</p>
                    {event.city && (
                      <p className="text-light-muted text-sm">
                        {event.city}, {event.country}
                      </p>
                    )}
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
                  <p className="text-light-muted text-sm font-medium mb-3">Share</p>
                  <div className="flex gap-3">
                    <a
                      href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
                        typeof window !== "undefined" ? window.location.href : ""
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-light-muted hover:text-[#1877F2] transition-colors"
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
                      className="text-light-muted hover:text-black transition-colors"
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
                className="inline-block w-full text-center bg-light-surface hover:bg-light-border text-dark-text font-semibold py-2 px-4 rounded transition-colors"
              >
                ← Back to Events
              </Link>
            </div>
          </div>

          {/* Other Events at Same Venue */}
          {otherVenueEvents.length > 0 && (
            <div className="mt-16 pt-12 border-t border-light-border">
              <h2 className="text-dark-text text-2xl font-bold mb-6">
                Other events at {event.venue}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {otherVenueEvents.map((venueEvent) => (
                  <Link
                    key={venueEvent.id}
                    href={`/events/${venueEvent.id}`}
                    className="group bg-white border border-light-border hover:border-brand transition-colors overflow-hidden"
                  >
                    <div className="aspect-video bg-light-surface overflow-hidden">
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
