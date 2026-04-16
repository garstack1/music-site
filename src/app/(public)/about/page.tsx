"use client";

import { useState } from "react";
import Link from "next/link";

export default function AboutPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("sending");
    setErrorMessage("");

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to send message");
      }

      setStatus("success");
      setFormData({ name: "", email: "", subject: "", message: "" });
    } catch (err) {
      setStatus("error");
      setErrorMessage(err instanceof Error ? err.message : "Something went wrong");
    }
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-dark-bg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-4xl md:text-5xl font-bold text-dark-text mb-6">
              Your Guide to <span className="text-brand">Live Music</span>
            </h1>
            <p className="text-dark-muted text-lg md:text-xl leading-relaxed">
              MusicSite is your comprehensive destination for discovering concerts, festivals, 
              and live music events across Ireland, the UK, and Europe. We bring you the latest 
              music news, honest concert reviews, and powerful tools to never miss a show.
            </p>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-light-bg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <h2 className="text-3xl font-bold text-center mb-12">What Makes Us Different</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1: Map Search */}
            <div className="bg-white border border-light-border p-8 hover:border-brand transition-colors">
              <div className="w-14 h-14 bg-brand/10 rounded-lg flex items-center justify-center mb-6">
                <svg className="w-7 h-7 text-brand" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-3">Interactive Map Search</h3>
              <p className="text-light-muted">
                Discover events visually with our interactive map. Find concerts and festivals 
                near you or explore events across Europe with ease.
              </p>
            </div>

            {/* Feature 2: Save Events */}
            <div className="bg-white border border-light-border p-8 hover:border-brand transition-colors">
              <div className="w-14 h-14 bg-brand/10 rounded-lg flex items-center justify-center mb-6">
                <svg className="w-7 h-7 text-brand" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-3">Save Your Favourites</h3>
              <p className="text-light-muted">
                Build your personal event wishlist. Save concerts and festivals you&apos;re 
                interested in and access them anytime from your account.
              </p>
            </div>

            {/* Feature 3: Sync Across Devices */}
            <div className="bg-white border border-light-border p-8 hover:border-brand transition-colors">
              <div className="w-14 h-14 bg-brand/10 rounded-lg flex items-center justify-center mb-6">
                <svg className="w-7 h-7 text-brand" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-3">Sync Across Devices</h3>
              <p className="text-light-muted">
                Create a free account to sync your saved events across all your devices. 
                Start on desktop, continue on mobile — your list is always with you.
              </p>
            </div>

            {/* Feature 4: Competitions */}
            <div className="bg-white border border-light-border p-8 hover:border-brand transition-colors">
              <div className="w-14 h-14 bg-brand/10 rounded-lg flex items-center justify-center mb-6">
                <svg className="w-7 h-7 text-brand" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-3">Exclusive Competitions</h3>
              <p className="text-light-muted">
                Subscribers get access to exclusive competitions. Win prizes including 
                concert tickets, albums, vinyl records, and more.
              </p>
            </div>

            {/* Feature 5: Pre-Sale Alerts */}
            <div className="bg-white border border-light-border p-8 hover:border-brand transition-colors">
              <div className="w-14 h-14 bg-brand/10 rounded-lg flex items-center justify-center mb-6">
                <svg className="w-7 h-7 text-brand" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-3">Pre-Sale Information</h3>
              <p className="text-light-muted">
                Never miss a pre-sale again. We track and display pre-sale dates so you 
                can get tickets before they sell out to the general public.
              </p>
            </div>

            {/* Feature 6: Concert Reviews */}
            <div className="bg-white border border-light-border p-8 hover:border-brand transition-colors">
              <div className="w-14 h-14 bg-brand/10 rounded-lg flex items-center justify-center mb-6">
                <svg className="w-7 h-7 text-brand" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-3">Honest Reviews</h3>
              <p className="text-light-muted">
                Read authentic concert reviews from real gig-goers. Get the inside scoop 
                on what to expect before you buy your tickets.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-dark-surface">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="text-3xl font-bold text-dark-text mb-4">Join Our Community</h2>
            <p className="text-dark-muted mb-8">
              Create a free account to save events, sync across devices, and get access 
              to exclusive competitions. No spam, no hassle — just great music.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/login"
                className="bg-brand hover:bg-brand-hover text-white font-medium px-8 py-3 transition-colors"
              >
                Create Free Account
              </Link>
              <Link
                href="/events"
                className="border border-dark-border text-dark-text hover:border-brand hover:text-brand font-medium px-8 py-3 transition-colors"
              >
                Browse Events
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Social Media Section */}
      <section className="bg-light-bg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <h2 className="text-3xl font-bold text-center mb-4">Follow Us</h2>
          <p className="text-light-muted text-center mb-10 max-w-xl mx-auto">
            Stay connected for the latest news, event announcements, and exclusive content.
          </p>
          
          <div className="flex justify-center gap-6">
            {/* Instagram */}
            <a
              href="https://instagram.com/musicsiteirl"
              target="_blank"
              rel="noopener noreferrer"
              className="w-14 h-14 bg-white border border-light-border rounded-full flex items-center justify-center hover:border-brand hover:text-brand transition-colors group"
              aria-label="Follow us on Instagram"
            >
              <svg className="w-6 h-6 text-light-muted group-hover:text-brand transition-colors" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
              </svg>
            </a>

            {/* X (Twitter) */}
            <a
              href="https://x.com/musicsiteirl"
              target="_blank"
              rel="noopener noreferrer"
              className="w-14 h-14 bg-white border border-light-border rounded-full flex items-center justify-center hover:border-brand hover:text-brand transition-colors group"
              aria-label="Follow us on X"
            >
              <svg className="w-6 h-6 text-light-muted group-hover:text-brand transition-colors" fill="currentColor" viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
            </a>

            {/* Facebook */}
            <a
              href="https://facebook.com/musicsiteirl"
              target="_blank"
              rel="noopener noreferrer"
              className="w-14 h-14 bg-white border border-light-border rounded-full flex items-center justify-center hover:border-brand hover:text-brand transition-colors group"
              aria-label="Follow us on Facebook"
            >
              <svg className="w-6 h-6 text-light-muted group-hover:text-brand transition-colors" fill="currentColor" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
            </a>

            {/* TikTok */}
            <a
              href="https://tiktok.com/@musicsiteirl"
              target="_blank"
              rel="noopener noreferrer"
              className="w-14 h-14 bg-white border border-light-border rounded-full flex items-center justify-center hover:border-brand hover:text-brand transition-colors group"
              aria-label="Follow us on TikTok"
            >
              <svg className="w-6 h-6 text-light-muted group-hover:text-brand transition-colors" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
              </svg>
            </a>

            {/* Bluesky */}
            <a
              href="https://bsky.app/profile/musicsiteirl.bsky.social"
              target="_blank"
              rel="noopener noreferrer"
              className="w-14 h-14 bg-white border border-light-border rounded-full flex items-center justify-center hover:border-brand hover:text-brand transition-colors group"
              aria-label="Follow us on Bluesky"
            >
              <svg className="w-6 h-6 text-light-muted group-hover:text-brand transition-colors" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 10.8c-1.087-2.114-4.046-6.053-6.798-7.995C2.566.944 1.561 1.266.902 1.565.139 1.908 0 3.08 0 3.768c0 .69.378 5.65.624 6.479.815 2.736 3.713 3.66 6.383 3.364.136-.02.275-.039.415-.056-.138.022-.276.04-.415.056-3.912.58-7.387 2.005-2.83 7.078 5.013 5.19 6.87-1.113 7.823-4.308.953 3.195 2.05 9.271 7.733 4.308 4.267-4.308 1.172-6.498-2.74-7.078a8.741 8.741 0 0 1-.415-.056c.14.017.279.036.415.056 2.67.297 5.568-.628 6.383-3.364.246-.828.624-5.79.624-6.478 0-.69-.139-1.861-.902-2.206-.659-.298-1.664-.62-4.3 1.24C16.046 4.748 13.087 8.687 12 10.8Z"/>
              </svg>
            </a>
          </div>
        </div>
      </section>

      {/* Contact Form Section */}
      <section className="bg-dark-bg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-3xl font-bold text-dark-text text-center mb-4">Get In Touch</h2>
            <p className="text-dark-muted text-center mb-10">
              Have a question, suggestion, or want to collaborate? We&apos;d love to hear from you.
            </p>

            {status === "success" ? (
              <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-8 text-center">
                <svg className="w-16 h-16 text-green-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="text-xl font-semibold text-dark-text mb-2">Message Sent!</h3>
                <p className="text-dark-muted">
                  Thank you for reaching out. We&apos;ll get back to you as soon as possible.
                </p>
                <button
                  onClick={() => setStatus("idle")}
                  className="mt-6 text-brand hover:text-brand-hover transition-colors"
                >
                  Send Another Message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="name" className="block text-dark-text text-sm font-medium mb-2">
                      Your Name
                    </label>
                    <input
                      type="text"
                      id="name"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full bg-dark-surface border border-dark-border text-dark-text px-4 py-3 focus:outline-none focus:border-brand transition-colors"
                      placeholder="John Doe"
                    />
                  </div>
                  <div>
                    <label htmlFor="email" className="block text-dark-text text-sm font-medium mb-2">
                      Email Address
                    </label>
                    <input
                      type="email"
                      id="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full bg-dark-surface border border-dark-border text-dark-text px-4 py-3 focus:outline-none focus:border-brand transition-colors"
                      placeholder="john@example.com"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="subject" className="block text-dark-text text-sm font-medium mb-2">
                    Subject
                  </label>
                  <select
                    id="subject"
                    required
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    className="w-full bg-dark-surface border border-dark-border text-dark-text px-4 py-3 focus:outline-none focus:border-brand transition-colors"
                  >
                    <option value="">Select a subject...</option>
                    <option value="general">General Enquiry</option>
                    <option value="feedback">Feedback</option>
                    <option value="partnership">Partnership / Collaboration</option>
                    <option value="press">Press / Media</option>
                    <option value="bug">Report a Bug</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="message" className="block text-dark-text text-sm font-medium mb-2">
                    Message
                  </label>
                  <textarea
                    id="message"
                    required
                    rows={6}
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    className="w-full bg-dark-surface border border-dark-border text-dark-text px-4 py-3 focus:outline-none focus:border-brand transition-colors resize-none"
                    placeholder="Tell us what's on your mind..."
                  />
                </div>

                {status === "error" && (
                  <div className="bg-red-900/20 border border-red-500/30 text-red-400 px-4 py-3 text-sm">
                    {errorMessage}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={status === "sending"}
                  className="w-full bg-brand hover:bg-brand-hover disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium px-8 py-3 transition-colors"
                >
                  {status === "sending" ? "Sending..." : "Send Message"}
                </button>
              </form>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
