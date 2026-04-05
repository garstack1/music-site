"use client";

import { useState, useEffect } from "react";

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/settings")
      .then((r) => r.json())
      .then((data) => setSettings(data.settings || {}))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function handleToggle(key: string, currentValue: string) {
    const newValue = currentValue === "true" ? "false" : "true";
    setSaving(key);

    try {
      await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, value: newValue }),
      });
      setSettings((prev) => ({ ...prev, [key]: newValue }));
    } catch {
      // ignore
    } finally {
      setSaving(null);
    }
  }

  if (loading) {
    return (
      <div>
        <h1 className="text-dark-text text-2xl font-bold mb-8">Settings</h1>
        <div className="text-dark-muted text-sm">Loading settings...</div>
      </div>
    );
  }

  const toggleSettings = [
    {
      key: "public_reviews_enabled",
      label: "Public Reviews",
      description: "Allow users to submit reviews and ratings on concert reviews",
    },
    {
      key: "stats_section_enabled",
      label: "Stats Section",
      description: "Show site statistics (events, artists, cities, ticket clicks) on the homepage",
    },
  ];

  return (
    <div>
      <h1 className="text-dark-text text-2xl font-bold mb-8">Settings</h1>

      <div className="bg-dark-surface border border-dark-border">
        {toggleSettings.map((setting) => (
          <div
            key={setting.key}
            className="flex items-center justify-between px-5 py-4 border-b border-dark-border last:border-0"
          >
            <div>
              <p className="text-dark-text text-sm font-medium">{setting.label}</p>
              <p className="text-dark-muted text-xs mt-0.5">{setting.description}</p>
            </div>
            <button
              onClick={() => handleToggle(setting.key, settings[setting.key] || "false")}
              disabled={saving === setting.key}
              className={`relative w-11 h-6 rounded-full transition-colors ${
                settings[setting.key] === "true" ? "bg-green-500" : "bg-dark-border"
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                  settings[setting.key] === "true" ? "translate-x-5" : ""
                }`}
              />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
