"use client";

import { useState, useEffect, useRef, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

function formatDateForInput(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toISOString().split("T")[0];
}

export default function EditReviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [title, setTitle] = useState("");
  const [artist, setArtist] = useState("");
  const [venue, setVenue] = useState("");
  const [city, setCity] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [setlist, setSetlist] = useState("");
  const [body, setBody] = useState("");
  const [status, setStatus] = useState("DRAFT");
  const [photos, setPhotos] = useState<string[]>([]);
  const [coverImage, setCoverImage] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [dragOver, setDragOver] = useState(false);

  useEffect(() => {
    fetch(`/api/admin/reviews/${id}`)
      .then((r) => r.json())
      .then((data) => {
        const r = data.review;
        if (r) {
          setTitle(r.title);
          setArtist(r.artist);
          setVenue(r.venue);
          setCity(r.city || "");
          setEventDate(formatDateForInput(r.eventDate));
          setSetlist(r.setlist || "");
          setBody(r.body);
          setStatus(r.status);
          setCoverImage(r.coverImage || null);
          setPhotos(r.photos.map((p: { url: string }) => p.url));
        }
      })
      .catch(() => setError("Failed to load review"))
      .finally(() => setLoading(false));
  }, [id]);

  async function uploadFiles(files: FileList | File[]) {
    setUploading(true);
    setError("");

    const formData = new FormData();
    Array.from(files).forEach((file) => formData.append("photos", file));

    try {
      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Upload failed");
        setUploading(false);
        return;
      }

      const newPhotos = [...photos, ...data.urls];
      setPhotos(newPhotos);
      if (!coverImage && newPhotos.length > 0) {
        setCoverImage(newPhotos[0]);
      }
    } catch {
      setError("Upload failed");
    } finally {
      setUploading(false);
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files.length > 0) {
      uploadFiles(e.target.files);
      e.target.value = "";
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      uploadFiles(e.dataTransfer.files);
    }
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(true);
  }

  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
  }

  function removePhoto(url: string) {
    const newPhotos = photos.filter((p) => p !== url);
    setPhotos(newPhotos);
    if (coverImage === url) {
      setCoverImage(newPhotos.length > 0 ? newPhotos[0] : null);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);

    try {
      const res = await fetch(`/api/admin/reviews/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          artist,
          venue,
          city,
          eventDate,
          setlist,
          body,
          status,
          photoUrls: photos,
          coverImage,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to update review");
        setSaving(false);
        return;
      }

      router.push("/admin/reviews");
    } catch {
      setError("Network error");
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div>
        <h1 className="text-dark-text text-2xl font-bold mb-8">Edit Review</h1>
        <div className="text-dark-muted text-sm">Loading...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-dark-text text-2xl font-bold">Edit Review</h1>
        <Link href="/admin/reviews" className="text-dark-muted hover:text-dark-text text-sm transition-colors">
          Cancel
        </Link>
      </div>

      {error && (
        <div className="mb-6 px-4 py-3 bg-red-900/30 border border-red-800/50 text-red-400 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-dark-surface border border-dark-border p-6 space-y-5">
        <div>
          <label htmlFor="title" className="block text-dark-muted text-xs mb-1.5">Title *</label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="w-full px-3 py-2 bg-dark-bg border border-dark-border text-dark-text text-sm placeholder-dark-muted focus:outline-none focus:border-brand transition-colors"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label htmlFor="artist" className="block text-dark-muted text-xs mb-1.5">Artist *</label>
            <input
              id="artist"
              type="text"
              value={artist}
              onChange={(e) => setArtist(e.target.value)}
              required
              className="w-full px-3 py-2 bg-dark-bg border border-dark-border text-dark-text text-sm placeholder-dark-muted focus:outline-none focus:border-brand transition-colors"
            />
          </div>
          <div>
            <label htmlFor="venue" className="block text-dark-muted text-xs mb-1.5">Venue *</label>
            <input
              id="venue"
              type="text"
              value={venue}
              onChange={(e) => setVenue(e.target.value)}
              required
              className="w-full px-3 py-2 bg-dark-bg border border-dark-border text-dark-text text-sm placeholder-dark-muted focus:outline-none focus:border-brand transition-colors"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label htmlFor="city" className="block text-dark-muted text-xs mb-1.5">City</label>
            <input
              id="city"
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="w-full px-3 py-2 bg-dark-bg border border-dark-border text-dark-text text-sm placeholder-dark-muted focus:outline-none focus:border-brand transition-colors"
            />
          </div>
          <div>
            <label htmlFor="eventDate" className="block text-dark-muted text-xs mb-1.5">Event Date *</label>
            <input
              id="eventDate"
              type="date"
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
              required
              className="w-full px-3 py-2 bg-dark-bg border border-dark-border text-dark-text text-sm focus:outline-none focus:border-brand transition-colors"
            />
          </div>
        </div>

        <div>
          <label htmlFor="setlist" className="block text-dark-muted text-xs mb-1.5">
            Setlist <span className="text-dark-muted">(one song per line)</span>
          </label>
          <textarea
            id="setlist"
            value={setlist}
            onChange={(e) => setSetlist(e.target.value)}
            rows={6}
            className="w-full px-3 py-2 bg-dark-bg border border-dark-border text-dark-text text-sm placeholder-dark-muted focus:outline-none focus:border-brand transition-colors resize-y"
          />
        </div>

        <div>
          <label htmlFor="body" className="block text-dark-muted text-xs mb-1.5">Review Body *</label>
          <textarea
            id="body"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            required
            rows={12}
            className="w-full px-3 py-2 bg-dark-bg border border-dark-border text-dark-text text-sm placeholder-dark-muted focus:outline-none focus:border-brand transition-colors resize-y"
          />
        </div>

        {/* Photo Upload */}
        <div>
          <label className="block text-dark-muted text-xs mb-2">Photos</label>

          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
              dragOver
                ? "border-brand bg-brand/10"
                : "border-dark-border hover:border-dark-muted"
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
            {uploading ? (
              <p className="text-dark-muted text-sm">Uploading...</p>
            ) : (
              <div>
                <p className="text-dark-muted text-sm">
                  Drop images here or click to browse
                </p>
                <p className="text-dark-muted text-xs mt-1">Max 10MB per image</p>
              </div>
            )}
          </div>

          {/* Mosaic Preview */}
          {photos.length > 0 && (
            <div className="mt-4">
              <p className="text-dark-muted text-xs mb-2">
                Click a photo to set it as the cover image.
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                {photos.map((url) => (
                  <div
                    key={url}
                    className={`relative group aspect-square rounded overflow-hidden border-2 transition-colors ${
                      coverImage === url
                        ? "border-brand"
                        : "border-transparent hover:border-dark-muted"
                    }`}
                  >
                    <img
                      src={url}
                      alt=""
                      className="w-full h-full object-cover cursor-pointer"
                      onClick={() => setCoverImage(url)}
                    />
                    {coverImage === url && (
                      <div className="absolute top-1 left-1 bg-brand text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                        COVER
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        removePhoto(url);
                      }}
                      className="absolute top-1 right-1 bg-black/70 text-white text-xs w-5 h-5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div>
          <label htmlFor="status" className="block text-dark-muted text-xs mb-1.5">Status</label>
          <select
            id="status"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full px-3 py-2 bg-dark-bg border border-dark-border text-dark-text text-sm focus:outline-none focus:border-brand transition-colors"
          >
            <option value="DRAFT">Draft</option>
            <option value="PUBLISHED">Published</option>
          </select>
        </div>

        <div className="flex items-center gap-3 pt-2">
          <button
            type="submit"
            disabled={saving || uploading}
            className="bg-brand hover:bg-brand-hover disabled:opacity-50 text-white px-5 py-2 text-sm font-medium transition-colors"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
          <Link href="/admin/reviews" className="text-dark-muted hover:text-dark-text text-sm transition-colors">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
