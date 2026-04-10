"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface EmailPreferences {
  id: string;
  frequency: "NONE" | "DAILY" | "WEEKLY" | "MONTHLY";
  preferredDay: number | null;
  includeFeatured: boolean;
  includePresale: boolean;
  includeExclusive: boolean;
  includeCompetitions: boolean;
  lastSentAt: string | null;
}

const DAYS_OF_WEEK = [
  { value: 0, label: "Sunday" },
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
];

export default function EmailPreferencesPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [preferences, setPreferences] = useState<EmailPreferences | null>(null);
  const [featureEnabled, setFeatureEnabled] = useState(true);

  useEffect(() => {
    checkFeatureAndFetchPreferences();
  }, []);

  async function checkFeatureAndFetchPreferences() {
    try {
      // First check if feature is enabled
      const settingsRes = await fetch("/api/settings");
      const settingsData = await settingsRes.json();
      
      if (settingsData.settings?.email_preferences_enabled !== "true") {
        setFeatureEnabled(false);
        setLoading(false);
        return;
      }

      // Then fetch preferences
      const res = await fetch("/api/user/email-preferences");
      if (res.status === 401) {
        router.push("/login?redirect=/account/preferences");
        return;
      }
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to load preferences");
        setLoading(false);
        return;
      }
      const data = await res.json();
      setPreferences(data.preferences);
    } catch {
      setError("Failed to load preferences");
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    if (!preferences) return;

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch("/api/user/email-preferences", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(preferences),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to save preferences");
        return;
      }

      const data = await res.json();
      setPreferences(data.preferences);
      setSuccess("Preferences saved successfully!");
      setTimeout(() => setSuccess(""), 3000);
    } catch {
      setError("Failed to save preferences");
    } finally {
      setSaving(false);
    }
  }

  function updatePreference<K extends keyof EmailPreferences>(
    key: K,
    value: EmailPreferences[K]
  ) {
    if (!preferences) return;
    setPreferences({ ...preferences, [key]: value });
  }

  if (loading) {
    return (
      <section className="bg-light-bg min-h-screen">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <h1 className="text-gray-900 text-2xl font-bold mb-8">Email Preferences</h1>
          <p className="text-gray-600">Loading...</p>
        </div>
      </section>
    );
  }

  if (!featureEnabled) {
    return (
      <section className="bg-light-bg min-h-screen">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
            <div className="text-4xl mb-4">📧</div>
            <h1 className="text-gray-900 text-2xl font-bold mb-4">Email Preferences</h1>
            <p className="text-gray-600 mb-6">
              Email subscriptions are not currently available. Check back later!
            </p>
            <a href="/" className="text-brand hover:underline">
              ← Back to Home
            </a>
          </div>
        </div>
      </section>
    );
  }

  if (!preferences) {
    return (
      <section className="bg-light-bg min-h-screen">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <h1 className="text-gray-900 text-2xl font-bold mb-8">Email Preferences</h1>
          <p className="text-gray-600">Unable to load preferences. Please try again.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="bg-light-bg min-h-screen">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-gray-900 text-2xl font-bold mb-2">Email Preferences</h1>
        <p className="text-gray-600 mb-8">
          Choose how often you&apos;d like to receive email updates about events and competitions.
        </p>

        {error && (
          <div className="mb-6 px-4 py-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 px-4 py-3 bg-green-50 border border-green-200 text-green-700 text-sm rounded">
            {success}
          </div>
        )}

        <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-8">
          {/* Frequency Selection */}
          <div>
            <h2 className="text-gray-900 font-semibold mb-4">Email Frequency</h2>
            <div className="space-y-3">
              {[
                { value: "NONE", label: "No emails", description: "I don't want to receive email updates" },
                { value: "DAILY", label: "Daily", description: "Receive updates every day" },
                { value: "WEEKLY", label: "Weekly", description: "Receive updates once a week" },
                { value: "MONTHLY", label: "Monthly", description: "Receive updates once a month" },
              ].map((option) => (
                <label
                  key={option.value}
                  className={`flex items-start gap-3 p-4 border rounded-lg cursor-pointer transition-colors ${
                    preferences.frequency === option.value
                      ? "border-brand bg-red-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <input
                    type="radio"
                    name="frequency"
                    value={option.value}
                    checked={preferences.frequency === option.value}
                    onChange={() => updatePreference("frequency", option.value as EmailPreferences["frequency"])}
                    className="mt-1 text-brand focus:ring-brand"
                  />
                  <div>
                    <span className="text-gray-900 font-medium">{option.label}</span>
                    <p className="text-gray-500 text-sm">{option.description}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Preferred Day (for Weekly) */}
          {preferences.frequency === "WEEKLY" && (
            <div>
              <h2 className="text-gray-900 font-semibold mb-4">Preferred Day</h2>
              <select
                value={preferences.preferredDay ?? 1}
                onChange={(e) => updatePreference("preferredDay", parseInt(e.target.value))}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-brand"
              >
                {DAYS_OF_WEEK.map((day) => (
                  <option key={day.value} value={day.value}>
                    {day.label}
                  </option>
                ))}
              </select>
              <p className="text-gray-500 text-sm mt-2">
                You&apos;ll receive your weekly digest on this day.
              </p>
            </div>
          )}

          {/* Preferred Day (for Monthly) */}
          {preferences.frequency === "MONTHLY" && (
            <div>
              <h2 className="text-gray-900 font-semibold mb-4">Preferred Day of Month</h2>
              <select
                value={preferences.preferredDay ?? 1}
                onChange={(e) => updatePreference("preferredDay", parseInt(e.target.value))}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-brand"
              >
                {Array.from({ length: 28 }, (_, i) => i + 1).map((day) => (
                  <option key={day} value={day}>
                    {day}{day === 1 ? "st" : day === 2 ? "nd" : day === 3 ? "rd" : "th"}
                  </option>
                ))}
              </select>
              <p className="text-gray-500 text-sm mt-2">
                You&apos;ll receive your monthly digest on this day.
              </p>
            </div>
          )}

          {/* Content Preferences */}
          {preferences.frequency !== "NONE" && (
            <div>
              <h2 className="text-gray-900 font-semibold mb-4">What to Include</h2>
              <p className="text-gray-500 text-sm mb-4">
                Select the types of content you want to see in your emails.
              </p>
              <div className="space-y-3">
                {[
                  { key: "includeFeatured", label: "Featured Events", description: "Hand-picked highlights and recommendations" },
                  { key: "includePresale", label: "Pre-sale Alerts", description: "Get notified about upcoming ticket pre-sales" },
                  { key: "includeExclusive", label: "Exclusive Events", description: "Subscriber-only events and early access" },
                  { key: "includeCompetitions", label: "Competitions", description: "Win tickets and prizes" },
                ].map((option) => (
                  <label
                    key={option.key}
                    className="flex items-start gap-3 p-4 border border-gray-200 rounded-lg cursor-pointer hover:border-gray-300 transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={preferences[option.key as keyof EmailPreferences] as boolean}
                      onChange={(e) =>
                        updatePreference(
                          option.key as keyof EmailPreferences,
                          e.target.checked as never
                        )
                      }
                      className="mt-1 text-brand focus:ring-brand rounded"
                    />
                    <div>
                      <span className="text-gray-900 font-medium">{option.label}</span>
                      <p className="text-gray-500 text-sm">{option.description}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Last Sent Info */}
          {preferences.lastSentAt && (
            <p className="text-gray-500 text-sm">
              Last email sent: {new Date(preferences.lastSentAt).toLocaleDateString("en-IE", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </p>
          )}

          {/* Save Button */}
          <div className="pt-4 border-t border-gray-200">
            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full bg-brand hover:bg-brand-hover text-white font-semibold py-3 px-4 rounded-lg transition-colors disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Preferences"}
            </button>
          </div>
        </div>

        {/* Back Link */}
        <div className="mt-6 text-center">
          <a href="/saved" className="text-brand hover:underline text-sm">
            ← Back to Saved Events
          </a>
        </div>
      </div>
    </section>
  );
}
