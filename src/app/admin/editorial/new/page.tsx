"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import ImageUploader from "@/components/admin/ImageUploader";
import GalleryUploader, { GalleryImageItem, GalleryDefaults } from "@/components/admin/GalleryUploader";

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

export default function NewEditorialPostPage() {
  const router = useRouter();
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
    // Social
    twitterCaption: "",
    twitterSchedule: "",
    instagramCaption: "",
    instagramSchedule: "",
    facebookCaption: "",
    facebookSchedule: "",
  });
  
  const [galleryImages, setGalleryImages] = useState<GalleryImageItem[]>([]);
  const [galleryStyle, setGalleryStyle] = useState("MASONRY");
  const [galleryDefaults, setGalleryDefaults] = useState<GalleryDefaults>({
    galleryArtist: "",
    galleryVenue: "",
    galleryEvent: "",
  });

  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);

  function handleChange(field: string, value: string | boolean) {
    setForm((prev) => {
      const updated = { ...prev, [field]: value };
      // Auto-generate slug from title unless user has manually edited it
      if (field === "title" && !slugManuallyEdited) {
        updated.slug = (value as string)
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)/g, "");
      }
      // If user edits slug directly, stop auto-generating
      if (field === "slug") {
        setSlugManuallyEdited(true);
      }
      return updated;
    });
  }

  async function handleSave(status: string) {
    if (!form.title.trim()) {
      setError("Title is required");
      return;
    }
    if (!form.type) {
      setError("Post type is required");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const res = await fetch("/api/admin/editorial", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          status,
          publishedAt: form.publishedAt || null,
          socialPosts: [
            form.twitterCaption && {
              platform: "TWITTER",
              caption: form.twitterCaption,
              scheduledAt: form.twitterSchedule || form.publishedAt,
            },
            form.instagramCaption && {
              platform: "INSTAGRAM",
              caption: form.instagramCaption,
              scheduledAt: form.instagramSchedule || form.publishedAt,
            },
            form.facebookCaption && {
              platform: "FACEBOOK",
              caption: form.facebookCaption,
              scheduledAt: form.facebookSchedule || form.publishedAt,
            },
          ].filter(Boolean),
          galleryImages,
          galleryStyle,
          ...galleryDefaults,
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

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-dark-text text-2xl font-bold">New Editorial Post</h1>
          <p className="text-dark-muted text-sm mt-1">Write and publish editorial content</p>
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
        {/* Main content - left 2 columns */}
        <div className="lg:col-span-2 space-y-6">

          {/* Title */}
          <div className="bg-dark-surface border border-dark-border p-6">
            <label className="block text-dark-muted text-xs font-medium mb-2 uppercase tracking-wider">
              Title *
            </label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => handleChange("title", e.target.value)}
              placeholder="Enter post title..."
              className="w-full bg-dark-bg border border-dark-border text-dark-text text-lg px-3 py-2 focus:outline-none focus:border-brand placeholder-dark-muted"
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

          {/* Excerpt */}
          <div className="bg-dark-surface border border-dark-border p-6">
            <label className="block text-dark-muted text-xs font-medium mb-2 uppercase tracking-wider">
              Excerpt
              <span className="ml-2 text-dark-muted font-normal normal-case">
                (shown in news teaser cards)
              </span>
            </label>
            <textarea
              value={form.excerpt}
              onChange={(e) => handleChange("excerpt", e.target.value)}
              placeholder="Brief summary shown in news feed and social previews..."
              rows={3}
              className="w-full bg-dark-bg border border-dark-border text-dark-text text-sm px-3 py-2 focus:outline-none focus:border-brand placeholder-dark-muted resize-none"
            />
          </div>

          {/* Body */}
          <div className="bg-dark-surface border border-dark-border p-6">
            <label className="block text-dark-muted text-xs font-medium mb-3 uppercase tracking-wider">
              Content *
            </label>
            <RichTextEditor
              value={form.body}
              onChange={(val) => handleChange("body", val)}
              placeholder="Write your article here..."
            />
          </div>

          {/* Social Media */}
          <div className="bg-dark-surface border border-dark-border p-6">
            <h3 className="text-dark-text text-sm font-medium mb-4">Social Media Scheduling</h3>
            <p className="text-dark-muted text-xs mb-6">
              Write captions for each platform. Leave blank to skip that platform.
            </p>

            {/* Twitter */}
            <div className="mb-6">
              <label className="block text-dark-muted text-xs font-medium mb-2 uppercase tracking-wider">
                Twitter / X
              </label>
              <textarea
                value={form.twitterCaption}
                onChange={(e) => handleChange("twitterCaption", e.target.value)}
                placeholder="Tweet caption... (280 chars recommended)"
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
                <span className="text-dark-muted text-xs">(defaults to publish time)</span>
              </div>
            </div>

            {/* Instagram */}
            <div className="mb-6">
              <label className="block text-dark-muted text-xs font-medium mb-2 uppercase tracking-wider">
                Instagram
              </label>
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

            {/* Facebook */}
            <div>
              <label className="block text-dark-muted text-xs font-medium mb-2 uppercase tracking-wider">
                Facebook
              </label>
              <textarea
                value={form.facebookCaption}
                onChange={(e) => handleChange("facebookCaption", e.target.value)}
                placeholder="Facebook post caption..."
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

        {/* Sidebar - right column */}
        <div className="space-y-6">

          {/* Publish Settings */}
          <div className="bg-dark-surface border border-dark-border p-6">
            <h3 className="text-dark-text text-sm font-medium mb-4">Publish Settings</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-dark-muted text-xs font-medium mb-2 uppercase tracking-wider">
                  Status
                </label>
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
                <label className="block text-dark-muted text-xs font-medium mb-2 uppercase tracking-wider">
                  Publish Date & Time
                </label>
                <input
                  type="datetime-local"
                  value={form.publishedAt}
                  onChange={(e) => handleChange("publishedAt", e.target.value)}
                  className="w-full bg-dark-bg border border-dark-border text-dark-text text-sm px-3 py-2 focus:outline-none focus:border-brand"
                />
                <p className="text-dark-muted text-xs mt-1">
                  Leave blank to publish immediately
                </p>
              </div>

              {/* Show in News checkbox */}
              <div className="pt-2 border-t border-dark-border">
                <label className="flex items-start gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={form.showInNews}
                    onChange={(e) => handleChange("showInNews", e.target.checked)}
                    className="mt-0.5 accent-brand"
                  />
                  <div>
                    <span className="text-dark-text text-sm group-hover:text-white transition-colors">
                      Show teaser in News
                    </span>
                    <p className="text-dark-muted text-xs mt-0.5">
                      A teaser card will appear on the News page linking to this post
                    </p>
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* Post Type */}
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
                  <span className="text-dark-muted text-sm group-hover:text-dark-text transition-colors">
                    {type.label}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Festival Tag */}
          <div className="bg-dark-surface border border-dark-border p-6">
            <h3 className="text-dark-text text-sm font-medium mb-4">Festival Tag</h3>
            <input
              type="text"
              value={form.festivalTag}
              onChange={(e) => handleChange("festivalTag", e.target.value)}
              placeholder="e.g. great-escape-2026"
              className="w-full bg-dark-bg border border-dark-border text-dark-text text-sm px-3 py-2 focus:outline-none focus:border-brand placeholder-dark-muted"
            />
            <p className="text-dark-muted text-xs mt-2">
              Groups all content for a festival together on its hub page
            </p>
          </div>

          {/* Images */}
          <div className="bg-dark-surface border border-dark-border p-6">
            <h3 className="text-dark-text text-sm font-medium mb-4">Images</h3>
            <div className="space-y-6">
              <ImageUploader
                label="Cover Image"
                value={form.coverImage}
                onChange={(url) => handleChange("coverImage", url)}
                folder="editorial"
                previewHeight="h-32"
              />
              <ImageUploader
                label="Social Share Image"
                hint="(1200×630)"
                value={form.socialImage}
                onChange={(url) => handleChange("socialImage", url)}
                folder="editorial"
                previewHeight="h-24"
              />
            </div>
          </div>

          {/* Gallery */}
          <div className="bg-dark-surface border border-dark-border p-6">
            <h3 className="text-dark-text text-sm font-medium mb-4">
              Photo Gallery
              <span className="text-dark-muted text-xs font-normal ml-2">
                (appears below article)
              </span>
            </h3>
              <GalleryUploader
                images={galleryImages}
                onChange={setGalleryImages}
                galleryStyle={galleryStyle}
                onStyleChange={setGalleryStyle}
                defaults={galleryDefaults}
                onDefaultsChange={setGalleryDefaults}
              />
          </div>
        </div>
      </div>
    </div>
  );
}
