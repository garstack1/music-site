"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function NewCompetitionPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [prize, setPrize] = useState("");
  const [prizeType, setPrizeType] = useState("TICKETS");
  const [imageUrl, setImageUrl] = useState("");
  const [rules, setRules] = useState("");
  const [startDate, setStartDate] = useState("");
  const [startTime, setStartTime] = useState("00:00");
  const [endDate, setEndDate] = useState("");
  const [endTime, setEndTime] = useState("23:59");
  const [maxEntries, setMaxEntries] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);

    try {
      const res = await fetch("/api/admin/competitions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          prize,
          prizeType,
          imageUrl,
          rules,
          startDate: `${startDate}T${startTime}:00`,
          endDate: `${endDate}T${endTime}:00`,
          maxEntries: maxEntries || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to create competition");
        setSaving(false);
        return;
      }

      router.push("/admin/competitions");
    } catch {
      setError("Network error");
      setSaving(false);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-dark-text text-2xl font-bold">New Competition</h1>
        <Link href="/admin/competitions" className="text-dark-muted hover:text-dark-text text-sm transition-colors">Cancel</Link>
      </div>

      {error && (
        <div className="mb-6 px-4 py-3 bg-red-900/30 border border-red-800/50 text-red-400 text-sm">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="bg-dark-surface border border-dark-border p-6 space-y-5">
        <div>
          <label htmlFor="title" className="block text-dark-muted text-xs mb-1.5">Title *</label>
          <input id="title" type="text" value={title} onChange={(e) => setTitle(e.target.value)} required
            className="w-full px-3 py-2 bg-dark-bg border border-dark-border text-dark-text text-sm placeholder-dark-muted focus:outline-none focus:border-brand transition-colors"
            placeholder="e.g. Win 2 tickets to Fontaines D.C." />
        </div>

        <div>
          <label htmlFor="description" className="block text-dark-muted text-xs mb-1.5">Description *</label>
          <textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} required rows={4}
            className="w-full px-3 py-2 bg-dark-bg border border-dark-border text-dark-text text-sm placeholder-dark-muted focus:outline-none focus:border-brand transition-colors resize-y"
            placeholder="Describe the competition..." />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label htmlFor="prize" className="block text-dark-muted text-xs mb-1.5">Prize *</label>
            <input id="prize" type="text" value={prize} onChange={(e) => setPrize(e.target.value)} required
              className="w-full px-3 py-2 bg-dark-bg border border-dark-border text-dark-text text-sm placeholder-dark-muted focus:outline-none focus:border-brand transition-colors"
              placeholder="e.g. 2x VIP Tickets" />
          </div>
          <div>
            <label htmlFor="prizeType" className="block text-dark-muted text-xs mb-1.5">Prize Type</label>
            <select id="prizeType" value={prizeType} onChange={(e) => setPrizeType(e.target.value)}
              className="w-full px-3 py-2 bg-dark-bg border border-dark-border text-dark-text text-sm focus:outline-none focus:border-brand transition-colors">
              <option value="TICKETS">Tickets</option>
              <option value="MERCHANDISE">Merchandise</option>
              <option value="VOUCHER">Voucher</option>
              <option value="EXPERIENCE">Experience</option>
              <option value="OTHER">Other</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label htmlFor="startDate" className="block text-dark-muted text-xs mb-1.5">Start Date *</label>
            <div className="flex gap-2">
              <input id="startDate" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required
                className="flex-1 px-3 py-2 bg-dark-bg border border-dark-border text-dark-text text-sm focus:outline-none focus:border-brand transition-colors" />
              <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)}
                className="w-28 px-3 py-2 bg-dark-bg border border-dark-border text-dark-text text-sm focus:outline-none focus:border-brand transition-colors" />
            </div>
          </div>
          <div>
            <label htmlFor="endDate" className="block text-dark-muted text-xs mb-1.5">End Date *</label>
            <div className="flex gap-2">
              <input id="endDate" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} required
                className="flex-1 px-3 py-2 bg-dark-bg border border-dark-border text-dark-text text-sm focus:outline-none focus:border-brand transition-colors" />
              <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)}
                className="w-28 px-3 py-2 bg-dark-bg border border-dark-border text-dark-text text-sm focus:outline-none focus:border-brand transition-colors" />
            </div>
          </div>
        </div>

        <div>
          <label htmlFor="maxEntries" className="block text-dark-muted text-xs mb-1.5">Max Entries (leave blank for unlimited)</label>
          <input id="maxEntries" type="number" value={maxEntries} onChange={(e) => setMaxEntries(e.target.value)}
            className="w-full px-3 py-2 bg-dark-bg border border-dark-border text-dark-text text-sm placeholder-dark-muted focus:outline-none focus:border-brand transition-colors"
            placeholder="e.g. 500" />
        </div>

        <div>
          <label htmlFor="imageUrl" className="block text-dark-muted text-xs mb-1.5">Image URL</label>
          <input id="imageUrl" type="url" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)}
            className="w-full px-3 py-2 bg-dark-bg border border-dark-border text-dark-text text-sm placeholder-dark-muted focus:outline-none focus:border-brand transition-colors"
            placeholder="https://example.com/image.jpg" />
        </div>

        <div>
          <label htmlFor="rules" className="block text-dark-muted text-xs mb-1.5">Rules & Terms</label>
          <textarea id="rules" value={rules} onChange={(e) => setRules(e.target.value)} rows={4}
            className="w-full px-3 py-2 bg-dark-bg border border-dark-border text-dark-text text-sm placeholder-dark-muted focus:outline-none focus:border-brand transition-colors resize-y"
            placeholder="Competition rules and terms..." />
        </div>

        <div className="flex items-center gap-3 pt-2">
          <button type="submit" disabled={saving}
            className="bg-brand hover:bg-brand-hover disabled:opacity-50 text-white px-5 py-2 text-sm font-medium transition-colors">
            {saving ? "Creating..." : "Create Competition"}
          </button>
          <Link href="/admin/competitions" className="text-dark-muted hover:text-dark-text text-sm transition-colors">Cancel</Link>
        </div>
      </form>
    </div>
  );
}
