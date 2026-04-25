"use client";

import { useState, useEffect, useCallback } from "react";

export interface GalleryImageItem {
  id?: string;
  url: string;
  caption?: string;
  altText?: string;
  tags?: string[];
  shutterSpeed?: string;
  aperture?: string;
  iso?: string;
  order: number;
}

interface GalleryMeta {
  artist?: string;
  venue?: string;
  event?: string;
}

interface GalleryProps {
  images: GalleryImageItem[];
  style?: "MASONRY" | "GRID" | "SLIDESHOW";
  siteName?: string;
  meta?: GalleryMeta;
}

function buildAlt(img: GalleryImageItem, meta?: GalleryMeta): string {
  if (img.altText) return img.altText;
  const parts = [];
  if (meta?.artist) parts.push(meta.artist);
  if (meta?.venue) parts.push(`live at ${meta.venue}`);
  if (meta?.event) parts.push(meta.event);
  if (img.tags && img.tags.length > 0) parts.push(img.tags.join(", "));
  if (img.caption) parts.push(img.caption);
  return parts.join(" - ") || "Concert photo";
}

function GalleryStructuredData({
  images,
  meta,
  siteName,
}: {
  images: GalleryImageItem[];
  meta?: GalleryMeta;
  siteName: string;
}) {
  const structured = {
    "@context": "https://schema.org",
    "@type": "ImageGallery",
    name: meta?.event || meta?.artist || "Photo Gallery",
    description: [
      meta?.artist,
      meta?.venue && `live at ${meta.venue}`,
      meta?.event,
    ]
      .filter(Boolean)
      .join(" "),
    image: images.map((img) => ({
      "@type": "ImageObject",
      url: img.url,
      name: buildAlt(img, meta),
      description: img.caption || buildAlt(img, meta),
      keywords: [
        meta?.artist,
        meta?.venue,
        meta?.event,
        ...(img.tags || []),
      ]
        .filter(Boolean)
        .join(", "),
      creditText: siteName,
      copyrightNotice: `© ${siteName}`,
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structured) }}
    />
  );
}

function Watermark({ siteName }: { siteName: string }) {
  return (
    <div className="absolute bottom-3 right-3 pointer-events-none select-none">
      <span
        className="text-white/40 text-xs font-semibold tracking-widest uppercase"
        style={{ textShadow: "0 1px 3px rgba(0,0,0,0.5)" }}
      >
        {siteName}
      </span>
    </div>
  );
}

function Lightbox({
  images,
  startIndex,
  siteName,
  meta,
  onClose,
}: {
  images: GalleryImageItem[];
  startIndex: number;
  siteName: string;
  meta?: GalleryMeta;
  onClose: () => void;
}) {
  const [current, setCurrent] = useState(startIndex);

  const prev = useCallback(() => {
    setCurrent((c) => (c > 0 ? c - 1 : images.length - 1));
  }, [images.length]);

  const next = useCallback(() => {
    setCurrent((c) => (c < images.length - 1 ? c + 1 : 0));
  }, [images.length]);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [prev, next, onClose]);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  const img = images[current];
  const hasMetadata = img.shutterSpeed || img.aperture || img.iso;

  return (
    <div className="fixed inset-0 z-50 bg-black/95 flex flex-col" onClick={onClose}>
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3 flex-shrink-0"
        onClick={(e) => e.stopPropagation()}
      >
        <span className="text-white/60 text-sm">
          {current + 1} / {images.length}
        </span>
        <button
          onClick={onClose}
          className="text-white/60 hover:text-white text-2xl transition-colors leading-none"
        >
          ✕
        </button>
      </div>

      {/* Main image */}
      <div
        className="flex-1 flex items-center justify-center relative px-12 min-h-0"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={prev}
          className="absolute left-2 top-1/2 -translate-y-1/2 text-white/60 hover:text-white text-3xl transition-colors w-10 h-10 flex items-center justify-center"
        >
          ‹
        </button>

        <div className="relative max-h-full max-w-full flex items-center justify-center">
          <img
            src={img.url}
            alt={buildAlt(img, meta)}
            className="max-h-[70vh] max-w-full object-contain"
            style={{ userSelect: "none" }}
          />
          <Watermark siteName={siteName} />
        </div>

        <button
          onClick={next}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-white/60 hover:text-white text-3xl transition-colors w-10 h-10 flex items-center justify-center"
        >
          ›
        </button>
      </div>

      {/* Caption and metadata */}
      {(img.caption || hasMetadata) && (
        <div
          className="flex-shrink-0 px-4 py-3 text-center"
          onClick={(e) => e.stopPropagation()}
        >
          {img.caption && (
            <p className="text-white/80 text-sm mb-1">{img.caption}</p>
          )}
          {hasMetadata && (
            <p className="text-white/40 text-xs space-x-3">
              {img.shutterSpeed && <span>⏱ {img.shutterSpeed}</span>}
              {img.aperture && <span>◎ {img.aperture}</span>}
              {img.iso && <span>ISO {img.iso}</span>}
            </p>
          )}
        </div>
      )}

      {/* Thumbnail strip */}
      <div
        className="flex-shrink-0 flex gap-1 px-4 pb-4 overflow-x-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {images.map((image, idx) => (
          <button
            key={idx}
            onClick={() => setCurrent(idx)}
            className={`flex-shrink-0 w-12 h-12 overflow-hidden border-2 transition-colors ${
              idx === current
                ? "border-brand"
                : "border-transparent opacity-50 hover:opacity-80"
            }`}
          >
            <img
              src={image.url}
              alt={buildAlt(image, meta)}
              className="w-full h-full object-cover"
            />
          </button>
        ))}
      </div>
    </div>
  );
}

function MasonryGallery({
  images,
  siteName,
  meta,
  onImageClick,
}: {
  images: GalleryImageItem[];
  siteName: string;
  meta?: GalleryMeta;
  onImageClick: (idx: number) => void;
}) {
  return (
    <div className="columns-2 md:columns-3 lg:columns-4 gap-2">
      {images.map((img, idx) => (
        <div
          key={idx}
          className="break-inside-avoid mb-2 relative group cursor-pointer overflow-hidden"
          onClick={() => onImageClick(idx)}
        >
          <img
            src={img.url}
            alt={buildAlt(img, meta)}
            className="w-full h-auto block group-hover:scale-105 transition-transform duration-300"
          />
          <Watermark siteName={siteName} />
          {img.caption && (
            <div className="absolute bottom-0 left-0 right-0 bg-black/60 px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <p className="text-white text-xs truncate">{img.caption}</p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function GridGallery({
  images,
  siteName,
  meta,
  onImageClick,
}: {
  images: GalleryImageItem[];
  siteName: string;
  meta?: GalleryMeta;
  onImageClick: (idx: number) => void;
}) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
      {images.map((img, idx) => (
        <div
          key={idx}
          className="relative group cursor-pointer overflow-hidden aspect-square"
          onClick={() => onImageClick(idx)}
        >
          <img
            src={img.url}
            alt={buildAlt(img, meta)}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          <Watermark siteName={siteName} />
          {img.caption && (
            <div className="absolute bottom-0 left-0 right-0 bg-black/60 px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <p className="text-white text-xs truncate">{img.caption}</p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function SlideshowGallery({
  images,
  siteName,
  meta,
  onImageClick,
}: {
  images: GalleryImageItem[];
  siteName: string;
  meta?: GalleryMeta;
  onImageClick: (idx: number) => void;
}) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2 snap-x snap-mandatory">
      {images.map((img, idx) => (
        <div
          key={idx}
          className="flex-shrink-0 relative group cursor-pointer overflow-hidden snap-start"
          style={{ width: "280px", height: "200px" }}
          onClick={() => onImageClick(idx)}
        >
          <img
            src={img.url}
            alt={buildAlt(img, meta)}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          <Watermark siteName={siteName} />
          {img.caption && (
            <div className="absolute bottom-0 left-0 right-0 bg-black/60 px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <p className="text-white text-xs truncate">{img.caption}</p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export default function Gallery({
  images,
  style = "MASONRY",
  siteName = "MUSICSITE",
  meta,
}: GalleryProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  if (!images || images.length === 0) return null;

  const sorted = [...images].sort((a, b) => a.order - b.order);

  return (
    <div className="mt-8">
      <GalleryStructuredData images={sorted} meta={meta} siteName={siteName} />

      <h3 className="text-light-text font-semibold text-lg mb-4">
        Gallery
        <span className="text-light-muted text-sm font-normal ml-2">
          ({images.length} photo{images.length !== 1 ? "s" : ""})
        </span>
      </h3>

      {style === "MASONRY" && (
        <MasonryGallery
          images={sorted}
          siteName={siteName}
          meta={meta}
          onImageClick={setLightboxIndex}
        />
      )}
      {style === "GRID" && (
        <GridGallery
          images={sorted}
          siteName={siteName}
          meta={meta}
          onImageClick={setLightboxIndex}
        />
      )}
      {style === "SLIDESHOW" && (
        <SlideshowGallery
          images={sorted}
          siteName={siteName}
          meta={meta}
          onImageClick={setLightboxIndex}
        />
      )}

      {lightboxIndex !== null && (
        <Lightbox
          images={sorted}
          startIndex={lightboxIndex}
          siteName={siteName}
          meta={meta}
          onClose={() => setLightboxIndex(null)}
        />
      )}
    </div>
  );
}
