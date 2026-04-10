"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";

interface FeaturedItem {
  id: string;
  type: "news" | "event";
  title: string;
  slug: string;
  imageUrl: string | null;
  date: string;
  summary?: string;
}

interface LargerFeaturedCarouselProps {
  items: FeaturedItem[];
}

export default function LargerFeaturedCarousel({ items }: LargerFeaturedCarouselProps) {
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
  }, [items]);

  useEffect(() => {
    if (items.length === 0) return;

    const timer = setInterval(() => {
      const el = scrollRef.current;
      if (!el) return;
      
      el.scrollBy({ left: el.clientWidth * 0.8, behavior: "smooth" });
      
      if (el.scrollLeft >= el.scrollWidth - el.clientWidth - 10) {
        setTimeout(() => {
          el.scrollTo({ left: 0, behavior: "smooth" });
        }, 500);
      }
    }, 5000);

    return () => clearInterval(timer);
  }, [items.length]);

  if (items.length === 0) return null;

  const getLink = (item: FeaturedItem) => {
    if (item.type === "news") {
      return `/news/${item.slug}`;
    } else {
      return `/events`;
    }
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
        {items.map((item) => (
          <div key={item.id} className="snap-start shrink-0 w-[calc(50%-8px)] min-w-[400px] flex">
            <Link href={getLink(item)} className="group w-full">
              <div className="bg-white border border-light-border hover:border-brand transition-colors overflow-hidden flex flex-col h-full">
                <div className="aspect-video bg-light-surface overflow-hidden relative">
                  {item.imageUrl ? (
                    <img
                      src={item.imageUrl}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-light-surface">
                      <span className="text-light-muted text-4xl">♪</span>
                    </div>
                  )}

                  <div className="absolute top-2 left-2">
                    <span className="text-xs font-bold px-2 py-1 rounded bg-brand text-white">
                      {item.type === "news" ? "NEWS" : "EVENT"}
                    </span>
                  </div>
                </div>

                <div className="p-4 flex-1 flex flex-col">
                  <h3 className="font-semibold text-base group-hover:text-brand transition-colors line-clamp-3">
                    {item.title}
                  </h3>
                  {item.summary && (
                    <p className="text-light-muted text-sm mt-2 line-clamp-3 flex-1">
                      {item.summary}
                    </p>
                  )}
                  <p className="text-light-muted text-sm mt-3">
                    {new Date(item.date).toLocaleDateString("en-IE", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                </div>
              </div>
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
