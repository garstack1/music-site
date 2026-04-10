"use client";

import { useState, useEffect } from "react";

interface SubscriberStats {
  total: number;
  daily: number;
  weekly: number;
  monthly: number;
  none: number;
  recentlySent: number;
}

interface SendResult {
  message: string;
  results?: {
    total: number;
    sent: number;
    failed: number;
    errors: string[];
  };
}

export default function AdminSubscribersPage() {
  const [stats, setStats] = useState<SubscriberStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState<SendResult | null>(null);
  const [error, setError] = useState("");
  
  // Test email state
  const [showTestEmail, setShowTestEmail] = useState(false);
  const [testEmail, setTestEmail] = useState("");
  const [sendingTest, setSendingTest] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message?: string; error?: string } | null>(null);

  useEffect(() => {
    fetchStats();
  }, []);

  async function fetchStats() {
    try {
      const res = await fetch("/api/admin/subscribers/stats");
      if (!res.ok) throw new Error("Failed to fetch stats");
      const data = await res.json();
      setStats(data.stats);
    } catch {
      setError("Failed to load subscriber stats");
    } finally {
      setLoading(false);
    }
  }

  async function handleSendTestEmail() {
    if (!testEmail.trim()) return;
    
    setSendingTest(true);
    setTestResult(null);

    try {
      const res = await fetch("/api/admin/test-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: testEmail.trim() }),
      });
      const data = await res.json();
      
      if (data.success) {
        setTestResult({ success: true, message: data.message });
      } else {
        setTestResult({ success: false, error: data.error });
      }
    } catch {
      setTestResult({ success: false, error: "Failed to send test email" });
    } finally {
      setSendingTest(false);
    }
  }

  async function handleSendEmails() {
    if (!confirm("Send digest emails to all eligible subscribers now?")) return;
    
    setSending(true);
    setSendResult(null);
    setError("");

    try {
      const res = await fetch("/api/cron/send-emails", { method: "POST" });
      const data = await res.json();
      
      if (!res.ok) {
        setError(data.error || "Failed to send emails");
        return;
      }
      
      setSendResult(data);
      fetchStats(); // Refresh stats after sending
    } catch {
      setError("Failed to send emails");
    } finally {
      setSending(false);
    }
  }

  if (loading) {
    return (
      <div>
        <h1 className="text-dark-text text-2xl font-bold mb-8">Subscribers</h1>
        <p className="text-dark-muted">Loading...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-dark-text text-2xl font-bold">Subscribers</h1>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowTestEmail(!showTestEmail)}
            className="bg-dark-surface border border-dark-border hover:border-brand text-dark-text px-4 py-2 text-sm font-medium transition-colors"
          >
            📧 Send Test Email
          </button>
          <button
            onClick={handleSendEmails}
            disabled={sending}
            className="bg-brand hover:bg-brand-hover text-white px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50"
          >
            {sending ? "Sending..." : "Send Emails Now"}
          </button>
        </div>
      </div>

      {/* Test Email Panel */}
      {showTestEmail && (
        <div className="mb-6 bg-dark-surface border border-dark-border p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-dark-text text-sm font-semibold">Send Test Email</h3>
            <button 
              onClick={() => { setShowTestEmail(false); setTestResult(null); }}
              className="text-dark-muted hover:text-dark-text text-xs"
            >
              ✕
            </button>
          </div>
          <p className="text-dark-muted text-xs mb-4">
            Send a sample digest email to test how it looks. Uses real data from your site.
          </p>
          <div className="flex gap-3">
            <input
              type="email"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSendTestEmail()}
              placeholder="Enter email address..."
              className="flex-1 px-3 py-2 bg-dark-bg border border-dark-border text-dark-text text-sm placeholder-dark-muted focus:outline-none focus:border-brand transition-colors"
            />
            <button
              onClick={handleSendTestEmail}
              disabled={sendingTest || !testEmail.trim()}
              className="bg-brand hover:bg-brand-hover text-white px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50"
            >
              {sendingTest ? "Sending..." : "Send Test"}
            </button>
          </div>
          {testResult && (
            <div className={`mt-3 text-sm ${testResult.success ? "text-green-400" : "text-red-400"}`}>
              {testResult.success ? testResult.message : `Error: ${testResult.error}`}
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="mb-6 px-4 py-3 bg-red-900/30 border border-red-800/50 text-red-400 text-sm">
          {error}
          <button onClick={() => setError("")} className="ml-3 text-red-300 hover:text-white">✕</button>
        </div>
      )}

      {sendResult && (
        <div className="mb-6 bg-dark-surface border border-dark-border p-4">
          <h3 className="text-dark-text text-sm font-semibold mb-3">Send Results</h3>
          <p className="text-dark-muted text-sm mb-2">{sendResult.message}</p>
          {sendResult.results && (
            <div className="flex gap-4 text-sm">
              <span className="text-dark-text">Total: {sendResult.results.total}</span>
              <span className="text-green-400">Sent: {sendResult.results.sent}</span>
              {sendResult.results.failed > 0 && (
                <span className="text-red-400">Failed: {sendResult.results.failed}</span>
              )}
            </div>
          )}
          {sendResult.results?.errors && sendResult.results.errors.length > 0 && (
            <div className="mt-3 text-xs text-red-400">
              <p className="font-medium mb-1">Errors:</p>
              {sendResult.results.errors.slice(0, 5).map((err, i) => (
                <p key={i}>{err}</p>
              ))}
              {sendResult.results.errors.length > 5 && (
                <p>...and {sendResult.results.errors.length - 5} more</p>
              )}
            </div>
          )}
          <button 
            onClick={() => setSendResult(null)} 
            className="text-dark-muted hover:text-dark-text text-xs mt-3"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          <div className="bg-dark-surface border border-dark-border p-4">
            <p className="text-dark-muted text-xs uppercase tracking-wide mb-1">Total Subscribers</p>
            <p className="text-dark-text text-2xl font-bold">{stats.total}</p>
          </div>
          <div className="bg-dark-surface border border-dark-border p-4">
            <p className="text-dark-muted text-xs uppercase tracking-wide mb-1">Daily</p>
            <p className="text-blue-400 text-2xl font-bold">{stats.daily}</p>
          </div>
          <div className="bg-dark-surface border border-dark-border p-4">
            <p className="text-dark-muted text-xs uppercase tracking-wide mb-1">Weekly</p>
            <p className="text-green-400 text-2xl font-bold">{stats.weekly}</p>
          </div>
          <div className="bg-dark-surface border border-dark-border p-4">
            <p className="text-dark-muted text-xs uppercase tracking-wide mb-1">Monthly</p>
            <p className="text-purple-400 text-2xl font-bold">{stats.monthly}</p>
          </div>
          <div className="bg-dark-surface border border-dark-border p-4">
            <p className="text-dark-muted text-xs uppercase tracking-wide mb-1">Unsubscribed</p>
            <p className="text-dark-muted text-2xl font-bold">{stats.none}</p>
          </div>
          <div className="bg-dark-surface border border-dark-border p-4">
            <p className="text-dark-muted text-xs uppercase tracking-wide mb-1">Sent Today</p>
            <p className="text-amber-400 text-2xl font-bold">{stats.recentlySent}</p>
          </div>
        </div>
      )}

      {/* Info Section */}
      <div className="bg-dark-surface border border-dark-border p-6">
        <h2 className="text-dark-text font-semibold mb-4">Email Sending Schedule</h2>
        <div className="space-y-3 text-sm">
          <div className="flex items-start gap-3">
            <span className="text-blue-400 font-mono w-16">Daily</span>
            <span className="text-dark-muted">Sent every day to subscribers who chose daily updates</span>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-green-400 font-mono w-16">Weekly</span>
            <span className="text-dark-muted">Sent on the subscriber&apos;s chosen day of the week</span>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-purple-400 font-mono w-16">Monthly</span>
            <span className="text-dark-muted">Sent on the subscriber&apos;s chosen day of the month (1-28)</span>
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-dark-border">
          <h3 className="text-dark-text font-semibold mb-3">Setup Instructions</h3>
          <div className="text-dark-muted text-sm space-y-2">
            <p>1. Set up a cron job to call <code className="bg-dark-bg px-1.5 py-0.5 rounded text-xs">/api/cron/send-emails</code> daily</p>
            <p>2. Configure your email provider in <code className="bg-dark-bg px-1.5 py-0.5 rounded text-xs">.env</code>:</p>
            <pre className="bg-dark-bg p-3 rounded text-xs mt-2 overflow-x-auto">
{`# Email provider: console, resend, brevo, sendgrid, ses
EMAIL_PROVIDER=console

# For Resend
RESEND_API_KEY=re_xxx

# For Brevo (Sendinblue)
BREVO_API_KEY=xkeysib-xxx

# For SendGrid
SENDGRID_API_KEY=SG.xxx

# Sender details
EMAIL_FROM_NAME=MUSICSITE
EMAIL_FROM_ADDRESS=noreply@yourdomain.com

# Cron security
CRON_SECRET=your-secret-key

# Site URL for email links
NEXT_PUBLIC_SITE_URL=https://yourdomain.com`}
            </pre>
            <p className="mt-4">3. For automatic sending, use one of these free options:</p>
            <ul className="list-disc list-inside ml-2 space-y-1">
              <li><strong>Vercel Cron</strong> - Add to vercel.json if hosting on Vercel</li>
              <li><strong>GitHub Actions</strong> - Free scheduled workflows</li>
              <li><strong>cron-job.org</strong> - Free external cron service</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
