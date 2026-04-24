"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import dynamic from "next/dynamic";

const RichTextEditor = dynamic(() => import("@/components/admin/RichTextEditor"), {
  ssr: false,
  loading: () => (
    <div className="border border-dark-border bg-dark-bg min-h-[400px] flex items-center justify-center">
      <span className="text-dark-muted text-sm">Loading editor...</span>
    </div>
  ),
});

const POST_TYPES = [
  { value: "FESTIVAL_PREVIEW", label: "Festival Preview" },
  { value: "FESTIVAL_UPDATE", label: "Festival Update" },
  { value: "FESTIVAL_RECAP", label: "Festival Recap" },
  { value: "CONCERT_REVIEW", label: "Concert Review" },
  { value: "FEATURE", label: "Feature" },
];

function formatDateTimeLocal(dateStr: string | null) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function EditEditorialPostPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    title: "",
    slug: "",
    type: "FESTIVAL_PREVIEW",
    excerpt: "",
    body: "",
    coverImage: "",
    socialImage: "",
    status: "DRAFT",
    publishedAt: "",
    showInNews: false,
    festivalTag: "",
    twitterCaption: "",
    twitterSchedule: "",
    instagramCaption: "",
    instagramSchedule: "",
    facebookCaption: "",
    facebookSchedule: "",
  });

  useEffect(() => {
    async function fetchPost() {
      try {
        const res = await fetch(`/api/admin/editorial/${id}`);
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || "Failed to load post");
          return;
        }
        const p = data.post;

        // Extract social posts
        const twitter = p.socialPosts?.find((s: {platform: string}) => s.platform === "TWITTER");
        const instagram = p.socialPosts?.find((s: {platform: string}) => s.platform === "INSTAGRAM");
        const facebook = p.socialPosts?.find((s: {platform: string}) => s.platform === "FACEBOOK");

        setForm({
          title: p.title || "",
          slug: p.slug || "",
          type: p.type || "FESTIVAL_PREVIEW",
          excerpt: p.excerpt || "",
          body: p.body || "",
          coverImage: p.coverImage || "",
          socialImage: p.socialImage || "",
          status: p.status || "DRAFT",
          publishedAt: formatDateTimeLocal(p.publishedAt),
          showInNews: p.showInNews || false,
          festivalTag: p.festivalTag || "",
          twitterCaption: twitter?.caption || "",
          twitterSchedule: formatDateTimeLocal(twitter?.scheduledAt),
          instagramCaption: instagram?.caption || "",
          instagramSchedule: formatDateTimeLocal(instagram?.scheduledAt),
          facebookCaption: facebook?.caption || "",
          facebookSchedule: formatDateTimeLocal(facebook?.scheduledAt),
        });
      } catch {
        setError("Failed to load post");
      } finally {
        setLoading(false);
      }
    }
    fetchPost();
  }, [id]);

  function handleChange(field: string, value: string | boolean) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSave(status: string) {
    if (!form.title.trim()) {
      setError("Title is required");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const res = await fetch(`/api/admin/editorial/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title,
          slug: form.slug,
          type: form.type,
          excerpt: form.excerpt,
          body: form.body,
          coverImage: form.coverImage,
          socialImage: form.socialImage,
          status,
          publishedAt: form.publishedAt || null,
          showInNews: form.showInNews,
          festivalTag: form.festivalTag,
          socialPosts: [
            form.twitterCaption && {
              platform: "TWITTER",
              caption: form.twitterCaption,
              scheduledAt: form.twitterSchedule || form.publishedAt || new Date().toISOString(),
            },
            form.instagramCaption && {
              platform: "INSTAGRAM",
              caption: form.instagramCaption,
              scheduledAt: form.instagramSchedule || form.publishedAt || new Date().toISOString(),
            },
            form.facebookCaption && {
              platform: "FACEBOOK",
              caption: form.facebookCaption,
              scheduledAt: form.facebookSchedule || form.publishedAt || new Date().toISOString(),
            },
          ].filter(Boolean),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to save post");
        return;
      }

      router.push("/admin/editorial");
    } catch {
      setError("Failed to save post");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div>
        <h1 className="text-dark-text text-2xl font-bold mb-8">Edit Post</h1>
        <div className="text-dark-muted text-sm">Loading post...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-dark-text text-2xl font-bold">Edit Post</h1>
          <p className="text-dark-muted text-sm mt-1 font-mono">{form.slug}</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => router.push("/admin/editorial")}
            className="border border-dark-border text-dark-muted hover:text-dark-text px-4 py-2 text-sm transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => handleSave("DRAFT")}
            disabled={saving}
            className="border border-dark-border text-dark-muted hover:text-dark-text px-4 py-2 text-sm transition-colors disabled:opacity-50"
          >
            Save Draft
          </button>
          <button
            onClick={() => handleSave(form.publishedAt ? "SCHEDULED" : "PUBLISHED")}
            disabled={saving}
            className="bg-brand hover:bg-brand-hover text-white px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50"
          >
            {saving ? "Saving..." : form.publishedAt ? "Schedule" : "Publish Now"}
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 px-4 py-3 bg-red-900/30 border border-red-800/50 text-red-400 text-sm">
          {error}
          <button onClick={() => setError("")} className="ml-3 text-red-300 hover:text-white">✕</button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">

          <div className="bg-dark-surface border border-dark-border p-6">
            <label className="block text-dark-muted text-xs font-medium mb-2 uppercase tracking-wider">
              Title *
            </label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => handleChange("title", e.target.value)}
              className="w-full bg-dark-bg border border-dark-border text-dark-text text-lg px-3 py-2 focus:outline-none focus:border-brand"
            />
            <div className="mt-2 flex items-center gap-2">
              <span className="text-dark-muted text-xs">Slug:</span>
              <input
                type="text"
                value={form.slug}
                onChange={(e) => handleChange("slug", e.target.value)}
                className="flex-1 bg-dark-bg border border-dark-border text-dark-muted text-xs px-2 py-1 focus:outline-none focus:border-brand"
              />
            </div>
          </div>

          <div className="bg-dark-surface border border-dark-border p-6">
            <label className="block text-dark-muted text-xs font-medium mb-2 uppercase tracking-wider">
              Excerpt
              <span className="ml-2 text-dark-muted font-normal normal-case">(shown in news teaser cards)</span>
            </label>
            <textarea
              value={form.excerpt}
              onChange={(e) => handleChange("excerpt", e.target.value)}
              rows={3}
              className="w-full bg-dark-bg border border-dark-border text-dark-text text-sm px-3 py-2 focus:outline-none focus:border-brand resize-none"
            />
          </div>

          <div className="bg-dark-surface border border-dark-border p-6">
            <label className="block text-dark-muted text-xs font-medium mb-3 uppercase tracking-wider">
              Content *
            </label>
            <RichTextEditor
              value={form.body}
              onChange={(val) => handleChange("body", val)}
            />
          </div>

          {/* Social Media */}
          <div className="bg-dark-surface border border-dark-border p-6">
            <h3 className="text-dark-text text-sm font-medium mb-4">Social Media Scheduling</h3>
            <p className="text-dark-muted text-xs mb-6">Leave blank to skip that platform.</p>

            <div className="mb-6">
              <label className="block text-dark-muted text-xs font-medium mb-2 uppercase tracking-wider">Twitter / X</label>
              <textarea
                value={form.twitterCaption}
                onChange={(e) => handleChange("twitterCaption", e.target.value)}
                placeholder="Tweet caption..."
                rows={2}
                maxLength={280}
                className="w-full bg-dark-bg border border-dark-border text-dark-text text-sm px-3 py-2 focus:outline-none focus:border-brand placeholder-dark-muted resize-none"
              />
              <div className="mt-2 flex items-center gap-3">
                <span className="text-dark-muted text-xs">Post at:</span>
                <input
                  type="datetime-local"
                  value={form.twitterSchedule}
                  onChange={(e) => handleChange("twitterSchedule", e.target.value)}
                  className="bg-dark-bg border border-dark-border text-dark-muted text-xs px-2 py-1 focus:outline-none focus:border-brand"
                />
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-dark-muted text-xs font-medium mb-2 uppercase tracking-wider">Instagram</label>
              <textarea
                value={form.instagramCaption}
                onChange={(e) => handleChange("instagramCaption", e.target.value)}
                placeholder="Instagram caption..."
                rows={3}
                className="w-full bg-dark-bg border border-dark-border text-dark-text text-sm px-3 py-2 focus:outline-none focus:border-brand placeholder-dark-muted resize-none"
              />
              <div className="mt-2 flex items-center gap-3">
                <span className="text-dark-muted text-xs">Post at:</span>
                <input
                  type="datetime-local"
                  value={form.instagramSchedule}
                  onChange={(e) => handleChange("instagramSchedule", e.target.value)}
                  className="bg-dark-bg border border-dark-border text-dark-muted text-xs px-2 py-1 focus:outline-none focus:border-brand"
                />
              </div>
            </div>

            <div>
              <label className="block text-dark-muted text-xs font-medium mb-2 uppercase tracking-wider">Facebook</label>
              <textarea
                value={form.facebookCaption}
                onChange={(e) => handleChange("facebookCaption", e.target.value)}
                placeholder="Facebook caption..."
                rows={3}
                className="w-full bg-dark-bg border border-dark-border text-dark-text text-sm px-3 py-2 focus:outline-none focus:border-brand placeholder-dark-muted resize-none"
              />
              <div className="mt-2 flex items-center gap-3">
                <span className="text-dark-muted text-xs">Post at:</span>
                <input
                  type="datetime-local"
                  value={form.facebookSchedule}
                  onChange={(e) => handleChange("facebookSchedule", e.target.value)}
                  className="bg-dark-bg border border-dark-border text-dark-muted text-xs px-2 py-1 focus:outline-none focus:border-brand"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">

          <div className="bg-dark-surface border border-dark-border p-6">
            <h3 className="text-dark-text text-sm font-medium mb-4">Publish Settings</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-dark-muted text-xs font-medium mb-2 uppercase tracking-wider">Status</label>
                <select
                  value={form.status}
                  onChange={(e) => handleChange("status", e.target.value)}
                  className="w-full bg-dark-bg border border-dark-border text-dark-text text-sm px-3 py-2 focus:outline-none focus:border-brand"
                >
                  <option value="DRAFT">Draft</option>
                  <option value="SCHEDULED">Scheduled</option>
                  <option value="PUBLISHED">Published</option>
                  <option value="ARCHIVED">Archived</option>
                </select>
              </div>
              <div>
                <label className="block text-dark-muted text-xs font-medium mb-2 uppercase tracking-wider">Publish Date & Time</label>
                <input
                  type="datetime-local"
                  value={form.publishedAt}
                  onChange={(e) => handleChange("publishedAt", e.target.value)}
                  className="w-full bg-dark-bg border border-dark-border text-dark-text text-sm px-3 py-2 focus:outline-none focus:border-brand"
                />
                <p className="text-dark-muted text-xs mt-1">Leave blank to publish immediately</p>
              </div>
              <div className="pt-2 border-t border-dark-border">
                <label className="flex items-start gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={form.showInNews}
                    onChange={(e) => handleChange("showInNews", e.target.checked)}
                    className="mt-0.5 accent-brand"
                  />
                  <div>
                    <span className="text-dark-text text-sm group-hover:text-white transition-colors">Show teaser in News</span>
                    <p className="text-dark-muted text-xs mt-0.5">A teaser card will appear on the News page</p>
                  </div>
                </label>
              </div>
            </div>
          </div>

          <div className="bg-dark-surface border border-dark-border p-6">
            <h3 className="text-dark-text text-sm font-medium mb-4">Post Type</h3>
            <div className="space-y-2">
              {POST_TYPES.map((type) => (
                <label key={type.value} className="flex items-center gap-3 cursor-pointer group">
                  <input
                    type="radio"
                    name="type"
                    value={type.value}
                    checked={form.type === type.value}
                    onChange={(e) => handleChange("type", e.target.value)}
                    className="accent-brand"
                  />
                  <span className="text-dark-muted text-sm group-hover:text-dark-text transition-colors">{type.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="bg-dark-surface border border-dark-border p-6">
            <h3 className="text-dark-text text-sm font-medium mb-4">Festival Tag</h3>
            <input
              type="text"
              value={form.festivalTag}
              onChange={(e) => handleChange("festivalTag", e.target.value)}
              placeholder="e.g. great-escape-2026"
              className="w-full bg-dark-bg border border-dark-border text-dark-text text-sm px-3 py-2 focus:outline-none focus:border-brand placeholder-dark-muted"
            />
            <p className="text-dark-muted text-xs mt-2">Groups all content for a festival together</p>
          </div>

          <div className="bg-dark-surface border border-dark-border p-6">
            <h3 className="text-dark-text text-sm font-medium mb-4">Images</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-dark-muted text-xs font-medium mb-2 uppercase tracking-wider">Cover Image URL</label>
                <input
                  type="text"
                  value={form.coverImage}
                  onChange={(e) => handleChange("coverImage", e.target.value)}
                  placeholder="https://..."
                  className="w-full bg-dark-bg border border-dark-border text-dark-text text-sm px-3 py-2 focus:outline-none focus:border-brand placeholder-dark-muted"
                />
                {form.coverImage && (
                  <img
                    src={form.coverImage}
                    alt="Cover preview"
                    className="mt-2 w-full h-32 object-cover border border-dark-border"
                    onError={(e) => (e.currentTarget.style.display = "none")}
                  />
                )}
              </div>
              <div>
                <label className="block text-dark-muted text-xs font-medium mb-2 uppercase tracking-wider">
                  Social Share Image URL
                  <span className="ml-1 font-normal normal-case text-dark-muted">(1200×630)</span>
                </label>
                <input
                  type="text"
                  value={form.socialImage}
                  onChange={(e) => handleChange("socialImage", e.target.value)}
                  placeholder="https://..."
                  className="w-full bg-dark-bg border border-dark-border text-dark-text text-sm px-3 py-2 focus:outline-none focus:border-brand placeholder-dark-muted"
                />
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
