"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";

interface FeaturedEvent {
  id: string;
  name: string;
  artist: string | null;
  venue: string | null;
  city: string | null;
  country: string;
  date: string;
  startTime: string | null;
  imageUrl: string | null;
}

interface TallFeaturedCarouselProps {
  events: FeaturedEvent[];
}

export default function TallFeaturedCarousel({ events }: TallFeaturedCarouselProps) {
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
    el.scrollBy({ left: dir === "left" ? -el.clientWidth * 0.6 : el.clientWidth * 0.6, behavior: "smooth" });
  }

  useEffect(() => {
    checkScroll();
    const el = scrollRef.current;
    if (el) el.addEventListener("scroll", checkScroll);
    return () => { if (el) el.removeEventListener("scroll", checkScroll); };
  }, [events]);

  useEffect(() => {
    if (events.length === 0) return;

    const timer = setInterval(() => {
      const el = scrollRef.current;
      if (!el) return;
      
      el.scrollBy({ left: el.clientWidth * 0.6, behavior: "smooth" });
      
      if (el.scrollLeft >= el.scrollWidth - el.clientWidth - 10) {
        setTimeout(() => {
          el.scrollTo({ left: 0, behavior: "smooth" });
        }, 500);
      }
    }, 5000);

    return () => clearInterval(timer);
  }, [events.length]);

  if (events.length === 0) return null;

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-IE", {
      day: "numeric",
      month: "short",
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

  const getShareUrl = (event: FeaturedEvent) => {
    return `${typeof window !== "undefined" ? window.location.origin : ""}/events?event=${event.id}`;
  };

  return (
    <div className="relative">
      {canScrollLeft && (
        <button
          onClick={() => scroll("left")}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white/90 border border-light-border shadow-md rounded-full w-10 h-10 flex items-center justify-center hover:bg-brand hover:text-white hover:border-brand transition-colors -ml-3"
          aria-label="Scroll left"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      )}
      {canScrollRight && (
        <button
          onClick={() => scroll("right")}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white/90 border border-light-border shadow-md rounded-full w-10 h-10 flex items-center justify-center hover:bg-brand hover:text-white hover:border-brand transition-colors -mr-3"
          aria-label="Scroll right"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      )}
      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-2 items-stretch"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {events.map((event) => (
          <div key={event.id} className="snap-start shrink-0 w-[calc(25%-12px)] min-w-[280px] flex">
            <div className="bg-white border border-light-border hover:border-brand transition-colors overflow-hidden flex flex-col h-full w-full">
              {/* Image */}
              <div className="aspect-video bg-light-surface overflow-hidden">
                {event.imageUrl ? (
                  <img
                    src={event.imageUrl}
                    alt={event.name}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-light-surface">
                    <span className="text-light-muted text-3xl">♪</span>
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="p-3 flex-1 flex flex-col">
                {/* Artist */}
                {event.artist && (
                  <p className="text-brand text-xs font-semibold uppercase mb-1">
                    {event.artist}
                  </p>
                )}

                {/* Event Name */}
                <Link href="/events" className="group">
                  <h3 className="font-semibold text-sm group-hover:text-brand transition-colors line-clamp-2 mb-2">
                    {event.name}
                  </h3>
                </Link>

                {/* Date & Time */}
                <div className="text-xs text-light-muted mb-2">
                  <p className="font-medium">{formatDate(event.date)}</p>
                  <p>{formatTime(event.startTime)}</p>
                </div>

                {/* Venue */}
                {event.venue && (
                  <p className="text-xs text-light-muted line-clamp-2 mb-3">
                    {event.venue}
                    {event.city && `, ${event.city}`}
                  </p>
                )}

                {/* Get Tickets Button */}
                <Link
                  href="/events"
                  className="w-full bg-brand hover:bg-brand-hover text-white text-xs font-semibold py-2 px-3 rounded text-center transition-colors mb-2"
                >
                  Get Tickets
                </Link>

                {/* Share Icons */}
                <div className="flex items-center gap-2 justify-center border-t border-light-border pt-2">
                  <a
                    href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(getShareUrl(event))}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-light-muted hover:text-[#1877F2] transition-colors"
                    title="Share on Facebook"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                    </svg>
                  </a>
                  <a
                    href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(getShareUrl(event))}&text=${encodeURIComponent(`Check out: ${event.name}`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-light-muted hover:text-black transition-colors"
                    title="Share on X"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                    </svg>
                  </a>
                  <a
                    href={`https://wa.me/?text=${encodeURIComponent(`Check out: ${event.name} - ${getShareUrl(event)}`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-light-muted hover:text-[#25D366] transition-colors"
                    title="Share on WhatsApp"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.67-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.076 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421-7.403h-.004a9.87 9.87 0 00-5.031 1.378c-1.567.897-2.813 2.476-3.29 4.203-.478 1.727-.372 3.527.564 5.155 1.202 2.016 3.607 3.231 6.159 3.231h.004c1.585 0 3.1-.474 4.366-1.375l.228.144c1.224.848 2.841 1.024 4.3.664 1.458-.36 2.64-1.164 3.405-2.412l-.321-.232c-1.119.335-2.669.235-3.652-.424 1.268-1.068 2.248-2.637 2.248-4.304 0-3.368-2.755-6.123-6.123-6.123" />
                    </svg>
                  </a>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
