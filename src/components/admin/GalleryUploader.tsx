"use client";

import { useState, useRef } from "react";
import exifr from "exifr";

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

export interface GalleryDefaults {
  galleryArtist: string;
  galleryVenue: string;
  galleryEvent: string;
}

interface GalleryUploaderProps {
  images: GalleryImageItem[];
  onChange: (images: GalleryImageItem[]) => void;
  galleryStyle: string;
  onStyleChange: (style: string) => void;
  defaults: GalleryDefaults;
  onDefaultsChange: (defaults: GalleryDefaults) => void;
}

const GALLERY_STYLES = [
  { value: "MASONRY", label: "Masonry", icon: "⊟" },
  { value: "GRID", label: "Grid", icon: "⊞" },
  { value: "SLIDESHOW", label: "Slideshow", icon: "▷" },
];

async function readExif(file: File): Promise<{
  shutterSpeed?: string;
  aperture?: string;
  iso?: string;
}> {
  try {
    const exif = await exifr.parse(file, {
      pick: ["ExposureTime", "FNumber", "ISO"],
    });
    if (!exif) return {};
    const shutterSpeed = exif.ExposureTime
      ? exif.ExposureTime < 1
        ? `1/${Math.round(1 / exif.ExposureTime)}s`
        : `${exif.ExposureTime}s`
      : undefined;
    const aperture = exif.FNumber ? `f/${exif.FNumber}` : undefined;
    const iso = exif.ISO ? String(exif.ISO) : undefined;
    return { shutterSpeed, aperture, iso };
  } catch {
    return {};
  }
}

function buildAutoAlt(defaults: GalleryDefaults, tags?: string[]): string {
  const parts = [];
  if (defaults.galleryArtist) parts.push(defaults.galleryArtist);
  if (defaults.galleryVenue) parts.push(`live at ${defaults.galleryVenue}`);
  if (defaults.galleryEvent) parts.push(defaults.galleryEvent);
  if (tags && tags.length > 0) parts.push(tags.join(", "));
  return parts.join(" - ");
}

export default function GalleryUploader({
  images,
  onChange,
  galleryStyle,
  onStyleChange,
  defaults,
  onDefaultsChange,
}: GalleryUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);
  const [tagInput, setTagInput] = useState<Record<number, string>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleFileUpload(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(true);

    try {
      const exifData = await Promise.all(
        Array.from(files).map((f) => readExif(f))
      );

      const formData = new FormData();
      Array.from(files).forEach((f) => formData.append("photos", f));
      formData.append("folder", "editorial");

      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) {
        setError(true);
        return;
      }

      const newImages: GalleryImageItem[] = data.urls.map(
        (url: string, i: number) => ({
          url,
          caption: "",
          altText: "",
          tags: [],
          shutterSpeed: exifData[i]?.shutterSpeed || "",
          aperture: exifData[i]?.aperture || "",
          iso: exifData[i]?.iso || "",
          order: images.length + i,
        })
      );

      onChange([...images, ...newImages]);
    } catch {
      setError(true);
    } finally {
      setUploading(false);
    }
  }

  function removeImage(idx: number) {
    const updated = images
      .filter((_, i) => i !== idx)
      .map((img, i) => ({ ...img, order: i }));
    onChange(updated);
    if (expandedId === idx) setExpandedId(null);
  }

  function updateImage(idx: number, field: keyof GalleryImageItem, value: string | string[]) {
    const updated = images.map((img, i) =>
      i === idx ? { ...img, [field]: value } : img
    );
    onChange(updated);
  }

  function addTag(idx: number) {
    const input = tagInput[idx]?.trim();
    if (!input) return;
    const currentTags = images[idx].tags || [];
    if (!currentTags.includes(input)) {
      updateImage(idx, "tags", [...currentTags, input]);
    }
    setTagInput((prev) => ({ ...prev, [idx]: "" }));
  }

  function removeTag(idx: number, tag: string) {
    const currentTags = images[idx].tags || [];
    updateImage(idx, "tags", currentTags.filter((t) => t !== tag));
  }

  function handleDragStart(idx: number) { setDraggedIdx(idx); }

  function handleDragOver(e: React.DragEvent, idx: number) {
    e.preventDefault();
    if (draggedIdx === null || draggedIdx === idx) return;
    const updated = [...images];
    const [moved] = updated.splice(draggedIdx, 1);
    updated.splice(idx, 0, moved);
    onChange(updated.map((img, i) => ({ ...img, order: i })));
    setDraggedIdx(idx);
  }

  function handleDragEnd() { setDraggedIdx(null); }

  return (
    <div className="space-y-4">

      {/* Gallery-level SEO defaults */}
      <div className="border border-dark-border bg-dark-bg p-3 space-y-3">
        <p className="text-dark-text text-xs font-medium uppercase tracking-wider">
          Gallery SEO Defaults
        </p>
        <p className="text-dark-muted text-xs">
          Auto-populates alt text for all photos: &quot;Artist live at Venue - Event&quot;
        </p>
        <div className="space-y-2">
          <div>
            <label className="block text-dark-muted text-xs mb-1">Artist</label>
            <input
              type="text"
              value={defaults.galleryArtist}
              onChange={(e) => onDefaultsChange({ ...defaults, galleryArtist: e.target.value })}
              placeholder="e.g. Fontaines D.C."
              className="w-full bg-dark-surface border border-dark-border text-dark-text text-xs px-2 py-1.5 focus:outline-none focus:border-brand placeholder-dark-muted"
            />
          </div>
          <div>
            <label className="block text-dark-muted text-xs mb-1">Venue</label>
            <input
              type="text"
              value={defaults.galleryVenue}
              onChange={(e) => onDefaultsChange({ ...defaults, galleryVenue: e.target.value })}
              placeholder="e.g. Vicar Street"
              className="w-full bg-dark-surface border border-dark-border text-dark-text text-xs px-2 py-1.5 focus:outline-none focus:border-brand placeholder-dark-muted"
            />
          </div>
          <div>
            <label className="block text-dark-muted text-xs mb-1">Event</label>
            <input
              type="text"
              value={defaults.galleryEvent}
              onChange={(e) => onDefaultsChange({ ...defaults, galleryEvent: e.target.value })}
              placeholder="e.g. Electric Picnic 2026"
              className="w-full bg-dark-surface border border-dark-border text-dark-text text-xs px-2 py-1.5 focus:outline-none focus:border-brand placeholder-dark-muted"
            />
          </div>
          {(defaults.galleryArtist || defaults.galleryVenue || defaults.galleryEvent) && (
            <div className="bg-dark-surface px-2 py-1.5 border border-dark-border">
              <p className="text-dark-muted text-xs">
                <span className="text-brand">Auto alt text:</span>{" "}
                {buildAutoAlt(defaults)}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Style selector */}
      <div>
        <p className="text-dark-muted text-xs font-medium uppercase tracking-wider mb-2">
          Display Style
        </p>
        <div className="flex gap-2">
          {GALLERY_STYLES.map((s) => (
            <button
              key={s.value}
              type="button"
              onClick={() => onStyleChange(s.value)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs transition-colors border ${
                galleryStyle === s.value
                  ? "bg-brand text-white border-brand"
                  : "border-dark-border text-dark-muted hover:text-dark-text"
              }`}
            >
              <span>{s.icon}</span>
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Upload area */}
      <div
        onClick={() => fileInputRef.current?.click()}
        className="w-full border border-dashed border-dark-border bg-dark-bg hover:border-brand transition-colors cursor-pointer px-3 py-4 text-center"
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => handleFileUpload(e.target.files)}
        />
        {uploading ? (
          <p className="text-dark-muted text-sm">Uploading and reading EXIF data...</p>
        ) : (
          <>
            <p className="text-dark-muted text-sm">Click to upload photos</p>
            <p className="text-dark-muted text-xs mt-1">
              EXIF data auto-read · Max 10MB · JPG, PNG, WebP
            </p>
          </>
        )}
      </div>

      {error && <p className="text-red-400 text-xs">Upload failed — please try again</p>}

      {/* Image grid */}
      {images.length > 0 && (
        <div>
          <p className="text-dark-muted text-xs mb-2">
            {images.length} photo{images.length !== 1 ? "s" : ""} — drag to reorder
          </p>
          <div className="grid grid-cols-3 gap-2">
            {images.map((img, idx) => (
              <div
                key={idx}
                draggable
                onDragStart={() => handleDragStart(idx)}
                onDragOver={(e) => handleDragOver(e, idx)}
                onDragEnd={handleDragEnd}
                className={`relative group cursor-grab active:cursor-grabbing border ${
                  draggedIdx === idx
                    ? "border-brand opacity-50"
                    : "border-dark-border"
                }`}
              >
                <div className="aspect-square overflow-hidden bg-dark-bg">
                  <img
                    src={img.url}
                    alt={img.altText || buildAutoAlt(defaults, img.tags)}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Indicators */}
                <div className="absolute bottom-1 left-1 flex gap-1">
                  {(img.shutterSpeed || img.aperture || img.iso) && (
                    <span className="bg-black/70 text-white text-xs px-1 py-0.5">EXIF</span>
                  )}
                  {img.tags && img.tags.length > 0 && (
                    <span className="bg-black/70 text-white text-xs px-1 py-0.5">
                      {img.tags.length} tag{img.tags.length !== 1 ? "s" : ""}
                    </span>
                  )}
                </div>

                {/* Order badge */}
                <div className="absolute top-1 left-1 bg-black/70 text-white text-xs px-1">
                  {idx + 1}
                </div>

                {/* Actions */}
                <div className="absolute top-1 right-1 flex gap-1">
                  <button
                    type="button"
                    onClick={() => setExpandedId(expandedId === idx ? null : idx)}
                    className="bg-black/70 text-white text-xs px-1.5 py-0.5 hover:bg-brand transition-colors"
                  >
                    ✎
                  </button>
                  <button
                    type="button"
                    onClick={() => removeImage(idx)}
                    className="bg-black/70 text-white text-xs px-1.5 py-0.5 hover:bg-red-600 transition-colors"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Expanded editor */}
          {expandedId !== null && images[expandedId] && (
            <div className="border border-dark-border bg-dark-bg p-3 space-y-3 mt-2">
              <div className="flex items-center justify-between">
                <p className="text-dark-text text-xs font-medium">Photo {expandedId + 1}</p>
                <button
                  type="button"
                  onClick={() => setExpandedId(null)}
                  className="text-dark-muted hover:text-dark-text text-xs"
                >
                  Close
                </button>
              </div>

              {/* Alt text */}
              <div>
                <label className="block text-dark-muted text-xs mb-1">
                  Alt Text Override
                  <span className="ml-1 font-normal text-dark-muted">(leave blank to auto-generate)</span>
                </label>
                <input
                  type="text"
                  value={images[expandedId].altText || ""}
                  onChange={(e) => updateImage(expandedId, "altText", e.target.value)}
                  placeholder={buildAutoAlt(defaults, images[expandedId].tags) || "Auto-generated from gallery defaults..."}
                  className="w-full bg-dark-surface border border-dark-border text-dark-text text-xs px-2 py-1.5 focus:outline-none focus:border-brand placeholder-dark-muted"
                />
              </div>

              {/* Caption */}
              <div>
                <label className="block text-dark-muted text-xs mb-1">Caption</label>
                <input
                  type="text"
                  value={images[expandedId].caption || ""}
                  onChange={(e) => updateImage(expandedId, "caption", e.target.value)}
                  placeholder="Optional caption shown in lightbox..."
                  className="w-full bg-dark-surface border border-dark-border text-dark-text text-xs px-2 py-1.5 focus:outline-none focus:border-brand placeholder-dark-muted"
                />
              </div>

              {/* Tags */}
              <div>
                <label className="block text-dark-muted text-xs mb-1">
                  Photo Tags
                  <span className="ml-1 font-normal text-dark-muted">(for SEO keywords)</span>
                </label>
                <div className="flex gap-1 mb-1 flex-wrap">
                  {(images[expandedId].tags || []).map((tag) => (
                    <span
                      key={tag}
                      className="bg-dark-surface border border-dark-border text-dark-text text-xs px-2 py-0.5 flex items-center gap-1"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeTag(expandedId, tag)}
                        className="text-dark-muted hover:text-brand transition-colors"
                      >
                        ✕
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-1">
                  <input
                    type="text"
                    value={tagInput[expandedId] || ""}
                    onChange={(e) => setTagInput((prev) => ({ ...prev, [expandedId]: e.target.value }))}
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag(expandedId); } }}
                    placeholder="e.g. crowd, guitar, stage..."
                    className="flex-1 bg-dark-surface border border-dark-border text-dark-text text-xs px-2 py-1.5 focus:outline-none focus:border-brand placeholder-dark-muted"
                  />
                  <button
                    type="button"
                    onClick={() => addTag(expandedId)}
                    className="bg-dark-surface border border-dark-border text-dark-muted hover:text-dark-text text-xs px-2 py-1.5 transition-colors"
                  >
                    Add
                  </button>
                </div>
              </div>

              {/* EXIF */}
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-dark-muted text-xs mb-1">
                    Shutter
                    {images[expandedId].shutterSpeed && (
                      <span className="ml-1 text-green-400 text-xs">✓ auto</span>
                    )}
                  </label>
                  <input
                    type="text"
                    value={images[expandedId].shutterSpeed || ""}
                    onChange={(e) => updateImage(expandedId, "shutterSpeed", e.target.value)}
                    placeholder="1/250s"
                    className="w-full bg-dark-surface border border-dark-border text-dark-text text-xs px-2 py-1.5 focus:outline-none focus:border-brand placeholder-dark-muted"
                  />
                </div>
                <div>
                  <label className="block text-dark-muted text-xs mb-1">
                    Aperture
                    {images[expandedId].aperture && (
                      <span className="ml-1 text-green-400 text-xs">✓ auto</span>
                    )}
                  </label>
                  <input
                    type="text"
                    value={images[expandedId].aperture || ""}
                    onChange={(e) => updateImage(expandedId, "aperture", e.target.value)}
                    placeholder="f/2.8"
                    className="w-full bg-dark-surface border border-dark-border text-dark-text text-xs px-2 py-1.5 focus:outline-none focus:border-brand placeholder-dark-muted"
                  />
                </div>
                <div>
                  <label className="block text-dark-muted text-xs mb-1">
                    ISO
                    {images[expandedId].iso && (
                      <span className="ml-1 text-green-400 text-xs">✓ auto</span>
                    )}
                  </label>
                  <input
                    type="text"
                    value={images[expandedId].iso || ""}
                    onChange={(e) => updateImage(expandedId, "iso", e.target.value)}
                    placeholder="3200"
                    className="w-full bg-dark-surface border border-dark-border text-dark-text text-xs px-2 py-1.5 focus:outline-none focus:border-brand placeholder-dark-muted"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
