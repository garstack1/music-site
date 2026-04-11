"use client";

import { useState, useEffect } from "react";

interface ImportLog {
  id: string;
  type: string;
  status: string;
  eventsCreated: number;
  eventsUpdated: number;
  eventsSkipped: number;
  errors: string | null;
  duration: number | null;
  triggeredBy: string | null;
  createdAt: string;
}

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  // Ticketmaster automation state
  const [tmSettings, setTmSettings] = useState({
    enabled: false,
    frequency: "daily",
    hour: 3,
    day: 0,
    lastRun: null as string | null,
  });
  const [tmLogs, setTmLogs] = useState<ImportLog[]>([]);
  const [tmLoading, setTmLoading] = useState(true);
  const [tmSaving, setTmSaving] = useState(false);
  const [tmRunning, setTmRunning] = useState(false);
  const [tmResult, setTmResult] = useState<{ success: boolean; message: string } | null>(null);

  useEffect(() => {
    // Load general settings
    fetch("/api/admin/settings")
      .then((r) => r.json())
      .then((data) => setSettings(data.settings || {}))
      .catch(() => {})
      .finally(() => setLoading(false));

    // Load Ticketmaster settings
    loadTmSettings();
  }, []);

  async function loadTmSettings() {
    try {
      const res = await fetch("/api/admin/ticketmaster/settings");
      if (res.ok) {
        const data = await res.json();
        setTmSettings({
          enabled: data.settings.ticketmaster_auto_enabled === "true",
          frequency: data.settings.ticketmaster_auto_frequency || "daily",
          hour: parseInt(data.settings.ticketmaster_auto_hour || "3"),
          day: parseInt(data.settings.ticketmaster_auto_day || "0"),
          lastRun: data.settings.ticketmaster_auto_last_run,
        });
        setTmLogs(data.recentLogs || []);
      }
    } catch {
      console.error("Failed to load TM settings");
    } finally {
      setTmLoading(false);
    }
  }

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

  async function saveTmSettings() {
    setTmSaving(true);
    try {
      const res = await fetch("/api/admin/ticketmaster/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          enabled: tmSettings.enabled,
          frequency: tmSettings.frequency,
          hour: tmSettings.hour,
          day: tmSettings.day,
        }),
      });
      if (res.ok) {
        setTmResult({ success: true, message: "Settings saved" });
        setTimeout(() => setTmResult(null), 3000);
      }
    } catch {
      setTmResult({ success: false, message: "Failed to save settings" });
    } finally {
      setTmSaving(false);
    }
  }

  async function runImportNow() {
    if (!confirm("Run Ticketmaster import now? This may take a few minutes.")) return;
    
    setTmRunning(true);
    setTmResult(null);
    
    try {
      const res = await fetch("/api/cron/ticketmaster", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ force: true, triggeredBy: "manual" }),
      });
      const data = await res.json();
      
      if (data.success) {
        setTmResult({
          success: true,
          message: `Import complete: ${data.totals.created} new, ${data.totals.updated} updated, ${data.totals.skipped} skipped`,
        });
        loadTmSettings(); // Refresh logs
      } else {
        setTmResult({ success: false, message: data.error || "Import failed" });
      }
    } catch {
      setTmResult({ success: false, message: "Import failed" });
    } finally {
      setTmRunning(false);
    }
  }

  const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

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
    {
      key: "competitions_enabled",
      label: "Competitions",
      description: "Show competitions section on the site and allow subscribers to enter",
    },
    {
      key: "email_preferences_enabled",
      label: "Email Preferences",
      description: "Allow users to manage their email subscription preferences and receive digest emails",
    },
  ];

  return (
    <div className="space-y-8">
      <h1 className="text-dark-text text-2xl font-bold">Settings</h1>

      {/* General Settings */}
      <div>
        <h2 className="text-dark-text text-lg font-semibold mb-4">General Settings</h2>
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

      {/* Ticketmaster Automation */}
      <div>
        <h2 className="text-dark-text text-lg font-semibold mb-4">Ticketmaster Auto-Import</h2>
        <div className="bg-dark-surface border border-dark-border p-5">
          {tmLoading ? (
            <p className="text-dark-muted text-sm">Loading...</p>
          ) : (
            <>
              {/* Enable/Disable */}
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-dark-border">
                <div>
                  <p className="text-dark-text text-sm font-medium">Enable Automatic Import</p>
                  <p className="text-dark-muted text-xs mt-0.5">
                    Automatically import events from Ticketmaster on a schedule
                  </p>
                </div>
                <button
                  onClick={() => setTmSettings((s) => ({ ...s, enabled: !s.enabled }))}
                  className={`relative w-11 h-6 rounded-full transition-colors ${
                    tmSettings.enabled ? "bg-green-500" : "bg-dark-border"
                  }`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                      tmSettings.enabled ? "translate-x-5" : ""
                    }`}
                  />
                </button>
              </div>

              {/* Schedule Settings */}
              <div className="space-y-4 mb-6">
                <div>
                  <label className="text-dark-text text-sm font-medium block mb-2">Frequency</label>
                  <select
                    value={tmSettings.frequency}
                    onChange={(e) => setTmSettings((s) => ({ ...s, frequency: e.target.value }))}
                    className="w-full px-3 py-2 bg-dark-bg border border-dark-border text-dark-text text-sm focus:outline-none focus:border-brand"
                  >
                    <option value="hourly">Hourly</option>
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                  </select>
                </div>

                {tmSettings.frequency === "weekly" && (
                  <div>
                    <label className="text-dark-text text-sm font-medium block mb-2">Day of Week</label>
                    <select
                      value={tmSettings.day}
                      onChange={(e) => setTmSettings((s) => ({ ...s, day: parseInt(e.target.value) }))}
                      className="w-full px-3 py-2 bg-dark-bg border border-dark-border text-dark-text text-sm focus:outline-none focus:border-brand"
                    >
                      {dayNames.map((name, i) => (
                        <option key={i} value={i}>{name}</option>
                      ))}
                    </select>
                  </div>
                )}

                {(tmSettings.frequency === "daily" || tmSettings.frequency === "weekly") && (
                  <div>
                    <label className="text-dark-text text-sm font-medium block mb-2">Time (Hour)</label>
                    <select
                      value={tmSettings.hour}
                      onChange={(e) => setTmSettings((s) => ({ ...s, hour: parseInt(e.target.value) }))}
                      className="w-full px-3 py-2 bg-dark-bg border border-dark-border text-dark-text text-sm focus:outline-none focus:border-brand"
                    >
                      {Array.from({ length: 24 }, (_, i) => (
                        <option key={i} value={i}>
                          {i.toString().padStart(2, "0")}:00 ({i < 12 ? `${i || 12} AM` : `${i - 12 || 12} PM`})
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Save & Run Buttons */}
              <div className="flex items-center gap-3 mb-6">
                <button
                  onClick={saveTmSettings}
                  disabled={tmSaving}
                  className="bg-brand hover:bg-brand-hover text-white px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50"
                >
                  {tmSaving ? "Saving..." : "Save Settings"}
                </button>
                <button
                  onClick={runImportNow}
                  disabled={tmRunning}
                  className="bg-dark-bg border border-dark-border hover:border-brand text-dark-text px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50"
                >
                  {tmRunning ? "Running..." : "Run Import Now"}
                </button>
              </div>

              {/* Result Message */}
              {tmResult && (
                <div
                  className={`mb-6 px-4 py-3 text-sm ${
                    tmResult.success
                      ? "bg-green-900/30 border border-green-800/50 text-green-400"
                      : "bg-red-900/30 border border-red-800/50 text-red-400"
                  }`}
                >
                  {tmResult.message}
                </div>
              )}

              {/* Last Run Info */}
              {tmSettings.lastRun && (
                <p className="text-dark-muted text-xs mb-4">
                  Last automatic run: {new Date(tmSettings.lastRun).toLocaleString("en-IE")}
                </p>
              )}

              {/* Recent Import Logs */}
              {tmLogs.length > 0 && (
                <div>
                  <h3 className="text-dark-text text-sm font-medium mb-3">Recent Import History</h3>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {tmLogs.map((log) => (
                      <div
                        key={log.id}
                        className={`p-3 text-xs border ${
                          log.status === "success"
                            ? "bg-green-900/10 border-green-800/30"
                            : log.status === "partial"
                            ? "bg-yellow-900/10 border-yellow-800/30"
                            : "bg-red-900/10 border-red-800/30"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-dark-text font-medium">
                            {new Date(log.createdAt).toLocaleString("en-IE")}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded text-xs ${
                              log.status === "success"
                                ? "bg-green-600 text-white"
                                : log.status === "partial"
                                ? "bg-yellow-600 text-white"
                                : "bg-red-600 text-white"
                            }`}
                          >
                            {log.status}
                          </span>
                        </div>
                        <div className="text-dark-muted">
                          {log.eventsCreated} new, {log.eventsUpdated} updated, {log.eventsSkipped} skipped
                          {log.duration && <span className="ml-2">({(log.duration / 1000).toFixed(1)}s)</span>}
                          {log.triggeredBy && <span className="ml-2">• {log.triggeredBy}</span>}
                        </div>
                        {log.errors && JSON.parse(log.errors).length > 0 && (
                          <div className="text-red-400 mt-1">
                            Errors: {JSON.parse(log.errors).slice(0, 2).join(", ")}
                            {JSON.parse(log.errors).length > 2 && ` +${JSON.parse(log.errors).length - 2} more`}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Setup Instructions */}
              <div className="mt-6 pt-4 border-t border-dark-border">
                <h3 className="text-dark-text text-sm font-medium mb-2">⚙️ Cron Setup Required</h3>
                <p className="text-dark-muted text-xs mb-2">
                  For automatic imports to work, you need to set up an external cron service to call this endpoint:
                </p>
                <code className="block bg-dark-bg px-3 py-2 text-xs text-brand mb-3 overflow-x-auto">
                  GET /api/cron/ticketmaster?secret=YOUR_CRON_SECRET
                </code>
                <p className="text-dark-muted text-xs">
                  Free options: <a href="https://cron-job.org" target="_blank" rel="noopener noreferrer" className="text-brand hover:underline">cron-job.org</a>,{" "}
                  <a href="https://vercel.com/docs/cron-jobs" target="_blank" rel="noopener noreferrer" className="text-brand hover:underline">Vercel Cron</a>,{" "}
                  or GitHub Actions. Set CRON_SECRET in your .env file.
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
