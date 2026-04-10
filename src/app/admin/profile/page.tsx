"use client";

import { useState, useEffect } from "react";

interface UserProfile {
  id: string;
  email: string;
  name: string | null;
  displayName: string | null;
}

export default function AdminProfilePage() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch("/api/admin/profile");
        const data = await res.json();
        if (res.ok) {
          setUser(data.user);
          setDisplayName(data.user.displayName || "");
        } else {
          setError(data.error || "Failed to load profile");
        }
      } catch {
        setError("Failed to load profile");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSaving(true);

    try {
      const res = await fetch("/api/admin/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ displayName }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to save profile");
      } else {
        setUser(data.user);
        setSuccess("Display name updated successfully!");
        setTimeout(() => setSuccess(""), 3000);
      }
    } catch {
      setError("Failed to save profile");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div>
        <h1 className="text-dark-text text-2xl font-bold mb-8">Profile</h1>
        <div className="text-dark-muted text-sm">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div>
        <h1 className="text-dark-text text-2xl font-bold mb-8">Profile</h1>
        <div className="text-dark-muted text-sm">Failed to load profile</div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-dark-text text-2xl font-bold mb-8">Profile</h1>

      <div className="bg-dark-surface border border-dark-border p-6 max-w-md">
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-dark-muted text-xs mb-1.5">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={user.email}
              disabled
              className="w-full px-3 py-2 bg-dark-bg border border-dark-border text-dark-muted text-sm font-mono placeholder-dark-muted focus:outline-none cursor-not-allowed"
            />
            <p className="text-dark-muted text-xs mt-1">Email cannot be changed</p>
          </div>

          <div>
            <label htmlFor="name" className="block text-dark-muted text-xs mb-1.5">
              Name
            </label>
            <input
              id="name"
              type="text"
              value={user.name || ""}
              disabled
              className="w-full px-3 py-2 bg-dark-bg border border-dark-border text-dark-muted text-sm placeholder-dark-muted focus:outline-none cursor-not-allowed"
            />
            <p className="text-dark-muted text-xs mt-1">Name is managed by system</p>
          </div>

          <div>
            <label htmlFor="displayName" className="block text-dark-muted text-xs mb-1.5">
              Display Name <span className="text-dark-muted">(shown when you create articles/news/reviews)</span>
            </label>
            <input
              id="displayName"
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="e.g., Your Name, Your Pseudonym, Admin Label"
              className="w-full px-3 py-2 bg-dark-bg border border-dark-border text-dark-text text-sm placeholder-dark-muted focus:outline-none focus:border-brand transition-colors"
            />
            <p className="text-dark-muted text-xs mt-1">
              This will appear as the source for any articles you create manually
            </p>
          </div>

          {error && (
            <div className="px-3 py-2 bg-red-900/30 border border-red-800/50 text-red-400 text-xs">
              {error}
            </div>
          )}

          {success && (
            <div className="px-3 py-2 bg-green-900/30 border border-green-800/50 text-green-400 text-xs">
              {success}
            </div>
          )}

          <button
            type="submit"
            disabled={saving}
            className="bg-brand hover:bg-brand-hover disabled:opacity-50 text-white px-4 py-2 text-sm font-medium transition-colors w-full"
          >
            {saving ? "Saving..." : "Save Display Name"}
          </button>
        </form>
      </div>

      <div className="mt-8 bg-dark-surface border border-dark-border p-6 max-w-md">
        <h2 className="text-dark-text text-sm font-semibold mb-4">Display Name Info</h2>
        <div className="text-dark-muted text-xs space-y-2">
          <p>
            <strong>Current Display Name:</strong> {displayName || "(not set)"}
          </p>
          <p>
            <strong>How it's used:</strong> When you create a manual article/news/review item, your display name will appear as the source instead of a feed name or email sender name.
          </p>
          <p>
            <strong>Example:</strong> If you set your display name to "Music Curator", all your manually created articles will show "Music Curator" as the source.
          </p>
        </div>
      </div>
    </div>
  );
}
