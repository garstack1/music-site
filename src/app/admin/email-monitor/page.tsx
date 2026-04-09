"use client";

import { useState, useEffect, useCallback } from "react";

interface Sender {
  id: string;
  name: string;
  email: string;
  startMarker: string;
  endMarker: string;
  gmailLabel: string | null;
  active: boolean;
  autoPublish: boolean;
  createdAt: string;
}

interface CheckResult {
  processed: number;
  imported: number;
  skipped: number;
  alreadyProcessed: number;
  errors: string[];
  articles: string[];
}

export default function EmailMonitorPage() {
  const [senders, setSenders] = useState<Sender[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [startMarker, setStartMarker] = useState("");
  const [endMarker, setEndMarker] = useState("");
  const [gmailLabel, setGmailLabel] = useState("");
  const [autoPublish, setAutoPublish] = useState(false);
  const [adding, setAdding] = useState(false);
  const [checking, setChecking] = useState(false);
  const [checkResult, setCheckResult] = useState<CheckResult | null>(null);

  const fetchSenders = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/approved-senders");
      const data = await res.json();
      setSenders(data.senders || []);
    } catch {
      setError("Failed to load senders");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSenders();
  }, [fetchSenders]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setAdding(true);

    try {
      const res = await fetch("/api/admin/approved-senders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          startMarker: startMarker || "",
          endMarker: endMarker || "",
          gmailLabel: gmailLabel || null,
          autoPublish,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Failed to add"); setAdding(false); return; }

      setName(""); setEmail(""); setStartMarker(""); setEndMarker(""); setGmailLabel(""); setAutoPublish(false);
      setShowForm(false);
      fetchSenders();
    } catch {
      setError("Network error");
    } finally {
      setAdding(false);
    }
  }

  async function handleToggle(id: string, field: "active" | "autoPublish", current: boolean) {
    try {
      await fetch(`/api/admin/approved-senders/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: !current }),
      });
      fetchSenders();
    } catch {
      setError("Failed to update");
    }
  }

  async function handleDelete(id: string, senderName: string) {
    if (!confirm(`Remove "${senderName}" from approved senders?`)) return;
    try {
      await fetch(`/api/admin/approved-senders/${id}`, { method: "DELETE" });
      fetchSenders();
    } catch {
      setError("Failed to delete");
    }
  }

  async function handleCheckEmails() {
    setChecking(true);
    setCheckResult(null);
    setError("");

    try {
      const res = await fetch("/api/admin/check-emails", { method: "POST" });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Check failed"); setChecking(false); return; }
      setCheckResult(data.result);
    } catch {
      setError("Check failed");
    } finally {
      setChecking(false);
    }
  }

  if (loading) {
    return (
      <div>
        <h1 className="text-dark-text text-2xl font-bold mb-8">Email Monitor</h1>
        <div className="text-dark-muted text-sm">Loading...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-dark-text text-2xl font-bold">Email Monitor</h1>
          <p className="text-dark-muted text-xs mt-1">Auto-import news from approved PR senders</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={handleCheckEmails} disabled={checking || senders.length === 0}
            className="bg-dark-surface border border-dark-border hover:border-brand text-dark-text px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50">
            {checking ? "Checking..." : "Check Inbox Now"}
          </button>
          <button onClick={() => setShowForm(!showForm)}
            className="bg-brand hover:bg-brand-hover text-white px-4 py-2 text-sm font-medium transition-colors">
            {showForm ? "Cancel" : "+ Add Sender"}
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 px-4 py-3 bg-red-900/30 border border-red-800/50 text-red-400 text-sm">
          {error}
          <button onClick={() => setError("")} className="ml-3 text-red-300 hover:text-white">x</button>
        </div>
      )}

      {checkResult && (
        <div className="mb-6 bg-dark-surface border border-dark-border p-4">
          <h3 className="text-dark-text text-sm font-semibold mb-3">Inbox Check Results</h3>
          <div className="flex gap-4 text-sm mb-2">
            <span className="text-dark-muted">Processed: <span className="text-dark-text">{checkResult.processed}</span></span>
            <span className="text-dark-muted">Imported: <span className="text-green-400">{checkResult.imported}</span></span>
            <span className="text-dark-muted">Skipped: <span className="text-dark-text">{checkResult.skipped}</span></span>
            <span className="text-dark-muted">Already processed: <span className="text-dark-text">{checkResult.alreadyProcessed}</span></span>
          </div>
          {checkResult.articles.length > 0 && (
            <div className="mt-2">
              <p className="text-green-400 text-xs font-medium mb-1">Articles created:</p>
              {checkResult.articles.map((title, i) => (
                <p key={i} className="text-dark-muted text-xs">- {title}</p>
              ))}
            </div>
          )}
          {checkResult.errors.length > 0 && (
            <div className="mt-2">
              <p className="text-red-400 text-xs font-medium mb-1">Errors:</p>
              {checkResult.errors.map((err, i) => (
                <p key={i} className="text-dark-muted text-xs">- {err}</p>
              ))}
            </div>
          )}
          <button onClick={() => setCheckResult(null)} className="text-dark-muted hover:text-dark-text text-xs mt-3 transition-colors">Dismiss</button>
        </div>
      )}

      {showForm && (
        <div className="bg-dark-surface border border-dark-border p-5 mb-6">
          <h2 className="text-dark-text text-sm font-semibold mb-4">Add Approved Sender</h2>
          <form onSubmit={handleAdd} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-dark-muted text-xs mb-1.5">Sender Name *</label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} required
                  placeholder="e.g. Sonic PR"
                  className="w-full px-3 py-2 bg-dark-bg border border-dark-border text-dark-text text-sm placeholder-dark-muted focus:outline-none focus:border-brand transition-colors" />
              </div>
              <div>
                <label className="block text-dark-muted text-xs mb-1.5">Email Address *</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
                  placeholder="e.g. laviea@sonicpr.co.uk"
                  className="w-full px-3 py-2 bg-dark-bg border border-dark-border text-dark-text text-sm placeholder-dark-muted focus:outline-none focus:border-brand transition-colors" />
              </div>
            </div>

            <div>
              <label className="block text-dark-muted text-xs mb-1.5">
                Gmail Label <span className="text-dark-muted">(optional - only check this label instead of whole inbox)</span>
              </label>
              <input type="text" value={gmailLabel} onChange={(e) => setGmailLabel(e.target.value)}
                placeholder="e.g. PR or Press Releases"
                className="w-full px-3 py-2 bg-dark-bg border border-dark-border text-dark-text text-sm placeholder-dark-muted focus:outline-none focus:border-brand transition-colors" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-dark-muted text-xs mb-1.5">
                  Start Marker <span className="text-dark-muted">(blank = read from start of email)</span>
                </label>
                <input type="text" value={startMarker} onChange={(e) => setStartMarker(e.target.value)}
                  placeholder="e.g. === or leave blank"
                  className="w-full px-3 py-2 bg-dark-bg border border-dark-border text-dark-text text-sm font-mono placeholder-dark-muted focus:outline-none focus:border-brand transition-colors" />
              </div>
              <div>
                <label className="block text-dark-muted text-xs mb-1.5">
                  End Marker <span className="text-dark-muted">(blank = read to end of email)</span>
                </label>
                <input type="text" value={endMarker} onChange={(e) => setEndMarker(e.target.value)}
                  placeholder="e.g. ****** or leave blank"
                  className="w-full px-3 py-2 bg-dark-bg border border-dark-border text-dark-text text-sm font-mono placeholder-dark-muted focus:outline-none focus:border-brand transition-colors" />
              </div>
            </div>

            <label className="flex items-center gap-2">
              <input type="checkbox" checked={autoPublish} onChange={(e) => setAutoPublish(e.target.checked)} className="accent-brand" />
              <span className="text-dark-muted text-xs">Auto-publish (skip draft, publish immediately)</span>
            </label>

            <button type="submit" disabled={adding}
              className="bg-brand hover:bg-brand-hover disabled:opacity-50 text-white px-4 py-2 text-sm font-medium transition-colors">
              {adding ? "Adding..." : "Add Sender"}
            </button>
          </form>
        </div>
      )}

      {senders.length === 0 ? (
        <div className="bg-dark-surface border border-dark-border p-8 text-center">
          <p className="text-dark-muted text-sm">No approved senders yet. Add one to start monitoring emails.</p>
        </div>
      ) : (
        <div className="bg-dark-surface border border-dark-border">
          <table className="w-full">
            <thead>
              <tr className="border-b border-dark-border">
                <th className="text-left text-dark-muted text-xs font-medium px-4 py-3">Sender</th>
                <th className="text-left text-dark-muted text-xs font-medium px-4 py-3 hidden md:table-cell">Email</th>
                <th className="text-center text-dark-muted text-xs font-medium px-4 py-3 hidden md:table-cell">Label</th>
                <th className="text-center text-dark-muted text-xs font-medium px-4 py-3 hidden lg:table-cell">Markers</th>
                <th className="text-center text-dark-muted text-xs font-medium px-4 py-3">Status</th>
                <th className="text-center text-dark-muted text-xs font-medium px-4 py-3 hidden md:table-cell">Mode</th>
                <th className="text-right text-dark-muted text-xs font-medium px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {senders.map((sender) => (
                <tr key={sender.id} className="border-b border-dark-border last:border-0 hover:bg-dark-bg/50 transition-colors">
                  <td className="px-4 py-3">
                    <span className="text-dark-text text-sm">{sender.name}</span>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <span className="text-dark-muted text-xs">{sender.email}</span>
                  </td>
                  <td className="px-4 py-3 text-center hidden md:table-cell">
                    <span className="text-dark-muted text-xs">{sender.gmailLabel || "INBOX"}</span>
                  </td>
                  <td className="px-4 py-3 text-center hidden lg:table-cell">
                    <span className="text-dark-muted text-xs font-mono">
                      {sender.startMarker || "(start)"} ... {sender.endMarker || "(end)"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button onClick={() => handleToggle(sender.id, "active", sender.active)}
                      className={`text-xs font-medium px-2 py-0.5 rounded ${sender.active ? "bg-green-900/30 text-green-400" : "bg-red-900/30 text-red-400"}`}>
                      {sender.active ? "Active" : "Paused"}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-center hidden md:table-cell">
                    <button onClick={() => handleToggle(sender.id, "autoPublish", sender.autoPublish)}
                      className={`text-xs font-medium px-2 py-0.5 rounded ${sender.autoPublish ? "bg-amber-900/30 text-amber-400" : "bg-dark-card text-dark-muted"}`}>
                      {sender.autoPublish ? "Auto" : "Draft"}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => handleDelete(sender.id, sender.name)}
                      className="text-dark-muted hover:text-brand text-xs transition-colors">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-6 bg-dark-surface border border-dark-border p-4">
        <h3 className="text-dark-text text-sm font-semibold mb-2">How it works</h3>
        <div className="text-dark-muted text-xs space-y-1">
          <p>1. Add PR contacts as approved senders with their email address</p>
          <p>2. Optionally set a Gmail label to search (faster than checking whole inbox)</p>
          <p>3. Set start/end markers if the sender uses them, or leave blank to import the full email</p>
          <p>4. Click "Check Inbox" to scan for new emails from approved senders</p>
          <p>5. Articles are created as hidden drafts (or auto-published if enabled)</p>
          <p>6. Review and publish from the News section</p>
        </div>
      </div>
    </div>
  );
}
