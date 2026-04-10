"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface SliderItem {
  id: string;
  title: string;
  slug: string;
  imageUrl: string | null;
}

interface FeaturedSliderProps {
  items: SliderItem[];
  type: "news" | "events"; // To generate correct links
}

export default function FeaturedSlider({ items, type }: FeaturedSliderProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlay, setIsAutoPlay] = useState(true);

  // Auto-advance slides every 5 seconds
  useEffect(() => {
    if (!isAutoPlay || items.length === 0) return;

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % items.length);
    }, 5000);

    return () => clearInterval(timer);
  }, [isAutoPlay, items.length]);

  if (items.length === 0) return null;

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + items.length) % items.length);
    setIsAutoPlay(false);
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % items.length);
    setIsAutoPlay(false);
  };

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
    setIsAutoPlay(false);
  };

  const currentItem = items[currentIndex];

  return (
    <div className="mb-12">
      <div className="relative bg-dark-bg overflow-hidden rounded-lg">
        {/* Slider Container */}
        <div className="relative aspect-video bg-dark-surface flex items-center justify-center overflow-hidden">
          {/* Image */}
          {currentItem.imageUrl ? (
            <img
              src={currentItem.imageUrl}
              alt={currentItem.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-dark-bg">
              <span className="text-dark-muted text-6xl">♪</span>
            </div>
          )}

          {/* Overlay with Title */}
          <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent flex items-end">
            <div className="w-full p-6">
              <Link href={`/${type}/${currentItem.slug}`}>
                <h2 className="text-2xl md:text-3xl font-bold text-white hover:text-brand transition-colors line-clamp-3">
                  {currentItem.title}
                </h2>
              </Link>
            </div>
          </div>

          {/* Featured Badge */}
          <div className="absolute top-4 left-4">
            <span className="text-xs font-bold px-3 py-1 rounded bg-brand text-white">
              FEATURED
            </span>
          </div>

          {/* Previous Button */}
          <button
            onClick={goToPrevious}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-20 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-colors"
            aria-label="Previous"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          {/* Next Button */}
          <button
            onClick={goToNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-20 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-colors"
            aria-label="Next"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* Dot Indicators and Auto-play Toggle */}
        <div className="bg-dark-bg p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {items.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`h-2 rounded-full transition-all ${
                  index === currentIndex
                    ? "bg-brand w-6"
                    : "bg-dark-border w-2 hover:bg-dark-muted"
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>

          {/* Auto-play Toggle */}
          <button
            onClick={() => setIsAutoPlay(!isAutoPlay)}
            className={`text-xs font-medium px-3 py-1 rounded transition-colors ${
              isAutoPlay
                ? "bg-brand text-white"
                : "bg-dark-border text-dark-muted hover:bg-dark-card"
            }`}
          >
            {isAutoPlay ? "Auto ▶" : "Auto ⏸"}
          </button>

          {/* Counter */}
          <span className="text-dark-muted text-sm">
            {currentIndex + 1} / {items.length}
          </span>
        </div>
      </div>
    </div>
  );
}
