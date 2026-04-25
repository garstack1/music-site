"use client";

import { useEffect, useState } from "react";
import Gallery, { GalleryImageItem } from "@/components/Gallery";

interface GallerySectionProps {
  images: GalleryImageItem[];
  style?: "MASONRY" | "GRID" | "SLIDESHOW";
  galleryArtist?: string;
  galleryVenue?: string;
  galleryEvent?: string;
}

export default function GallerySection({
  images,
  style = "MASONRY",
  galleryArtist,
  galleryVenue,
  galleryEvent,
}: GallerySectionProps) {
  const [siteName, setSiteName] = useState("MUSICSITE");

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((d) => {
        if (d.settings?.site_name) setSiteName(d.settings.site_name);
      })
      .catch(() => {});
  }, []);

  if (!images || images.length === 0) return null;

  return (
    <Gallery
      images={images}
      style={style}
      siteName={siteName}
      meta={{
        artist: galleryArtist,
        venue: galleryVenue,
        event: galleryEvent,
      }}
    />
  );
}
