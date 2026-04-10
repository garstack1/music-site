"use client";

import Link from "next/link";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { user, loading, logout } = useAuth();

  return (
    <header className="bg-dark-bg border-b border-dark-border sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            <span className="text-dark-text text-xl font-semibold tracking-wider">
              MUSIC<span className="text-brand">SITE</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8">
            <Link href="/news" className="text-dark-muted hover:text-dark-text transition-colors text-sm tracking-wide">
              News
            </Link>
            <Link href="/events" className="text-dark-muted hover:text-dark-text transition-colors text-sm tracking-wide">
              Events
            </Link>
            <Link href="/reviews" className="text-dark-muted hover:text-dark-text transition-colors text-sm tracking-wide">
              Reviews
            </Link>
            <Link href="/competitions" className="text-dark-muted hover:text-dark-text transition-colors text-sm tracking-wide">
              Competitions
            </Link>
            <Link href="/search" className="text-dark-muted hover:text-dark-text transition-colors text-sm tracking-wide">
              Search
            </Link>
            <Link href="/saved" className="text-dark-muted hover:text-brand transition-colors" title="Saved Events">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </Link>

            {/* Auth */}
            {loading ? (
              <div className="w-8 h-8" />
            ) : user ? (
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 text-dark-muted hover:text-dark-text transition-colors"
                >
                  <div className="w-8 h-8 bg-brand rounded-full flex items-center justify-center text-white text-xs font-bold">
                    {(user.name || user.email).charAt(0).toUpperCase()}
                  </div>
                </button>
                {userMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />
                    <div className="absolute right-0 top-12 bg-dark-surface border border-dark-border rounded shadow-lg z-50 w-56">
                      <div className="px-4 py-3 border-b border-dark-border">
                        <p className="text-dark-text text-sm font-medium truncate">{user.name || "User"}</p>
                        <p className="text-dark-muted text-xs truncate">{user.email}</p>
                      </div>
                      <Link
                        href="/saved"
                        className="block px-4 py-2.5 text-dark-muted hover:text-dark-text hover:bg-dark-bg text-sm transition-colors"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        Saved Events
                      </Link>
                      <Link
                        href="/account/preferences"
                        className="block px-4 py-2.5 text-dark-muted hover:text-dark-text hover:bg-dark-bg text-sm transition-colors"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        Email Preferences
                      </Link>
                      <button
                        onClick={() => {
                          setUserMenuOpen(false);
                          logout();
                        }}
                        className="block w-full text-left px-4 py-2.5 text-dark-muted hover:text-brand hover:bg-dark-bg text-sm transition-colors border-t border-dark-border"
                      >
                        Sign out
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <Link
                href="/login"
                className="text-dark-muted hover:text-dark-text transition-colors text-sm tracking-wide"
              >
                Sign in
              </Link>
            )}
          </nav>

          {/* Mobile menu button */}
          <button
            className="md:hidden text-dark-muted hover:text-dark-text"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {mobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Nav */}
        {mobileMenuOpen && (
          <nav className="md:hidden pb-4 border-t border-dark-border pt-4 flex flex-col gap-4">
            <Link href="/news" className="text-dark-muted hover:text-dark-text text-sm tracking-wide" onClick={() => setMobileMenuOpen(false)}>
              News
            </Link>
            <Link href="/events" className="text-dark-muted hover:text-dark-text text-sm tracking-wide" onClick={() => setMobileMenuOpen(false)}>
              Events
            </Link>
            <Link href="/reviews" className="text-dark-muted hover:text-dark-text text-sm tracking-wide" onClick={() => setMobileMenuOpen(false)}>
              Reviews
            </Link>
            <Link href="/competitions" className="text-dark-muted hover:text-dark-text text-sm tracking-wide" onClick={() => setMobileMenuOpen(false)}>
              Competitions
            </Link>
            <Link href="/search" className="text-dark-muted hover:text-dark-text text-sm tracking-wide" onClick={() => setMobileMenuOpen(false)}>
              Search
            </Link>
            <Link href="/saved" className="text-dark-muted hover:text-dark-text text-sm tracking-wide flex items-center gap-2" onClick={() => setMobileMenuOpen(false)}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              Saved Events
            </Link>
            {!loading && (
              user ? (
                <>
                  <div className="border-t border-dark-border pt-4">
                    <p className="text-dark-text text-sm font-medium">{user.name || "User"}</p>
                    <p className="text-dark-muted text-xs">{user.email}</p>
                  </div>
                  <Link href="/account/preferences" className="text-dark-muted hover:text-dark-text text-sm tracking-wide" onClick={() => setMobileMenuOpen(false)}>
                    Email Preferences
                  </Link>
                  <button
                    onClick={() => { setMobileMenuOpen(false); logout(); }}
                    className="text-dark-muted hover:text-brand text-sm tracking-wide text-left"
                  >
                    Sign out
                  </button>
                </>
              ) : (
                <Link href="/login" className="text-brand hover:text-brand-hover text-sm font-medium tracking-wide" onClick={() => setMobileMenuOpen(false)}>
                  Sign in / Register
                </Link>
              )
            )}
          </nav>
        )}
      </div>
    </header>
  );
}
