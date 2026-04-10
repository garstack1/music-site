"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface FeaturedItem {
  id: string;
  type: "news" | "event";
  title: string;
  slug: string;
  imageUrl: string | null;
  date: string; // publishedAt or date
  summary?: string;
}

interface HomeFeaturedSliderProps {
  items: FeaturedItem[];
}

export default function HomeFeaturedSlider({ items }: HomeFeaturedSliderProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Auto-advance slides every 6 seconds
  useEffect(() => {
    if (items.length === 0) return;

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % items.length);
    }, 6000);

    return () => clearInterval(timer);
  }, [items.length]);

  if (items.length === 0) return null;

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + items.length) % items.length);
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % items.length);
  };

  const currentItem = items[currentIndex];
  const itemLink = `/${currentItem.type}/${currentItem.slug}`;

  return (
    <div className="mb-12">
      <div className="relative bg-dark-bg overflow-hidden rounded-lg">
        {/* Slider Container */}
        <div className="relative aspect-video bg-dark-surface flex items-center justify-center overflow-hidden group">
          {/* Image */}
          {currentItem.imageUrl ? (
            <img
              src={currentItem.imageUrl}
              alt={currentItem.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-dark-bg">
              <span className="text-dark-muted text-6xl">♪</span>
            </div>
          )}

          {/* Overlay with Content */}
          <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent flex items-end">
            <div className="w-full p-6">
              <Link href={itemLink}>
                <div className="flex items-start justify-between mb-3">
                  <span className="text-xs font-bold px-2 py-1 rounded bg-brand text-white">
                    {currentItem.type === "news" ? "NEWS" : "EVENT"}
                  </span>
                </div>
                <h2 className="text-xl md:text-2xl font-bold text-white hover:text-brand transition-colors line-clamp-2 mb-2">
                  {currentItem.title}
                </h2>
                {currentItem.summary && (
                  <p className="text-white/80 text-sm line-clamp-2">
                    {currentItem.summary}
                  </p>
                )}
              </Link>
            </div>
          </div>

          {/* Previous Button */}
          <button
            onClick={goToPrevious}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-20 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-colors opacity-0 group-hover:opacity-100"
            aria-label="Previous"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          {/* Next Button */}
          <button
            onClick={goToNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-20 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-colors opacity-0 group-hover:opacity-100"
            aria-label="Next"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* Dot Indicators */}
        <div className="bg-dark-bg px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {items.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`h-2 rounded-full transition-all ${
                  index === currentIndex
                    ? "bg-brand w-8"
                    : "bg-dark-border w-2 hover:bg-dark-muted"
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>

          {/* Counter */}
          <span className="text-dark-muted text-sm">
            {currentIndex + 1} / {items.length}
          </span>
        </div>
      </div>
    </div>
  );
}
