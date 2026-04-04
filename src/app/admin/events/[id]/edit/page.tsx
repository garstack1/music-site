"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

function formatDateForInput(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toISOString().split("T")[0];
}

export default function EditEventPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [name, setName] = useState("");
  const [type, setType] = useState("CONCERT");
  const [artist, setArtist] = useState("");
  const [venue, setVenue] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("IE");
  const [date, setDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [ticketUrl, setTicketUrl] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [genre, setGenre] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/admin/events/${id}`)
      .then((r) => r.json())
      .then((data) => {
        const e = data.event;
        if (e) {
          setName(e.name);
          setType(e.type);
          setArtist(e.artist || "");
          setVenue(e.venue || "");
          setCity(e.city || "");
          setCountry(e.country);
          setDate(formatDateForInput(e.date));
          setEndDate(e.endDate ? formatDateForInput(e.endDate) : "");
          setTicketUrl(e.ticketUrl || "");
          setDescription(e.description || "");
          setImageUrl(e.imageUrl || "");
          setGenre(e.genre || "");
        }
      })
      .catch(() => setError("Failed to load event"))
      .finally(() => setLoading(false));
  }, [id]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);

    try {
      const res = await fetch(`/api/admin/events/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          type,
          artist,
          venue,
          city,
          country,
          date,
          endDate: endDate || null,
          ticketUrl,
          description,
          imageUrl,
          genre,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to update event");
        setSaving(false);
        return;
      }

      router.push("/admin/events");
    } catch {
      setError("Network error");
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div>
        <h1 className="text-dark-text text-2xl font-bold mb-8">Edit Event</h1>
        <div className="text-dark-muted text-sm">Loading...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-dark-text text-2xl font-bold">Edit Event</h1>
        <Link href="/admin/events" className="text-dark-muted hover:text-dark-text text-sm transition-colors">
          Cancel
        </Link>
      </div>

      {error && (
        <div className="mb-6 px-4 py-3 bg-red-900/30 border border-red-800/50 text-red-400 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-dark-surface border border-dark-border p-6 space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label htmlFor="name" className="block text-dark-muted text-xs mb-1.5">Event Name *</label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-3 py-2 bg-dark-bg border border-dark-border text-dark-text text-sm placeholder-dark-muted focus:outline-none focus:border-brand transition-colors"
            />
          </div>

          <div>
            <label htmlFor="type" className="block text-dark-muted text-xs mb-1.5">Type *</label>
            <select
              id="type"
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full px-3 py-2 bg-dark-bg border border-dark-border text-dark-text text-sm focus:outline-none focus:border-brand transition-colors"
            >
              <option value="CONCERT">Concert</option>
              <option value="FESTIVAL">Festival</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label htmlFor="artist" className="block text-dark-muted text-xs mb-1.5">Artist</label>
            <input
              id="artist"
              type="text"
              value={artist}
              onChange={(e) => setArtist(e.target.value)}
              className="w-full px-3 py-2 bg-dark-bg border border-dark-border text-dark-text text-sm placeholder-dark-muted focus:outline-none focus:border-brand transition-colors"
            />
          </div>

          <div>
            <label htmlFor="venue" className="block text-dark-muted text-xs mb-1.5">Venue</label>
            <input
              id="venue"
              type="text"
              value={venue}
              onChange={(e) => setVenue(e.target.value)}
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
            <label htmlFor="country" className="block text-dark-muted text-xs mb-1.5">Country *</label>
            <select
              id="country"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              className="w-full px-3 py-2 bg-dark-bg border border-dark-border text-dark-text text-sm focus:outline-none focus:border-brand transition-colors"
            >
              <option value="IE">Ireland</option>
              <option value="UK">United Kingdom</option>
              <option value="ES">Spain</option>
              <option value="FR">France</option>
              <option value="DE">Germany</option>
              <option value="NL">Netherlands</option>
              <option value="PT">Portugal</option>
              <option value="BE">Belgium</option>
              <option value="IT">Italy</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label htmlFor="date" className="block text-dark-muted text-xs mb-1.5">Date *</label>
            <input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              className="w-full px-3 py-2 bg-dark-bg border border-dark-border text-dark-text text-sm focus:outline-none focus:border-brand transition-colors"
            />
          </div>

          <div>
            <label htmlFor="endDate" className="block text-dark-muted text-xs mb-1.5">End Date (festivals)</label>
            <input
              id="endDate"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 bg-dark-bg border border-dark-border text-dark-text text-sm focus:outline-none focus:border-brand transition-colors"
            />
          </div>
        </div>

        <div>
          <label htmlFor="ticketUrl" className="block text-dark-muted text-xs mb-1.5">Ticket URL</label>
          <input
            id="ticketUrl"
            type="url"
            value={ticketUrl}
            onChange={(e) => setTicketUrl(e.target.value)}
            className="w-full px-3 py-2 bg-dark-bg border border-dark-border text-dark-text text-sm placeholder-dark-muted focus:outline-none focus:border-brand transition-colors"
          />
        </div>

        <div>
          <label htmlFor="imageUrl" className="block text-dark-muted text-xs mb-1.5">Image URL</label>
          <input
            id="imageUrl"
            type="url"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            className="w-full px-3 py-2 bg-dark-bg border border-dark-border text-dark-text text-sm placeholder-dark-muted focus:outline-none focus:border-brand transition-colors"
          />
        </div>

        <div>
          <label htmlFor="genre" className="block text-dark-muted text-xs mb-1.5">Genre</label>
          <input
            id="genre"
            type="text"
            value={genre}
            onChange={(e) => setGenre(e.target.value)}
            className="w-full px-3 py-2 bg-dark-bg border border-dark-border text-dark-text text-sm placeholder-dark-muted focus:outline-none focus:border-brand transition-colors"
          />
        </div>

        <div>
          <label htmlFor="description" className="block text-dark-muted text-xs mb-1.5">Description</label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            className="w-full px-3 py-2 bg-dark-bg border border-dark-border text-dark-text text-sm placeholder-dark-muted focus:outline-none focus:border-brand transition-colors resize-y"
          />
        </div>

        <div className="flex items-center gap-3 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="bg-brand hover:bg-brand-hover disabled:opacity-50 text-white px-5 py-2 text-sm font-medium transition-colors"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
          <Link href="/admin/events" className="text-dark-muted hover:text-dark-text text-sm transition-colors">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
