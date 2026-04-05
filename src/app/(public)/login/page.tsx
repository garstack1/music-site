"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";

export default function LoginPage() {
  const router = useRouter();
  const { login, register, user } = useAuth();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (user) {
    router.push("/");
    return null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    let result;
    if (mode === "login") {
      result = await login(email, password);
    } else {
      if (password.length < 8) {
        setError("Password must be at least 8 characters");
        setLoading(false);
        return;
      }
      result = await register(email, password, name);
    }

    if (result.success) {
      router.push("/");
    } else {
      setError(result.error || "Something went wrong");
      setLoading(false);
    }
  }

  return (
    <>
      <section className="bg-dark-bg">
        <div className="max-w-md mx-auto px-4 py-16">
          {/* Logo */}
          <div className="text-center mb-10">
            <Link href="/">
              <span className="text-dark-text text-2xl font-semibold tracking-wider">
                MUSIC<span className="text-brand">SITE</span>
              </span>
            </Link>
          </div>

          {/* Tabs */}
          <div className="flex mb-8">
            <button
              onClick={() => { setMode("login"); setError(""); }}
              className={`flex-1 pb-3 text-sm font-medium transition-colors ${
                mode === "login"
                  ? "text-dark-text border-b-2 border-brand"
                  : "text-dark-muted border-b border-dark-border"
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => { setMode("register"); setError(""); }}
              className={`flex-1 pb-3 text-sm font-medium transition-colors ${
                mode === "register"
                  ? "text-dark-text border-b-2 border-brand"
                  : "text-dark-muted border-b border-dark-border"
              }`}
            >
              Create Account
            </button>
          </div>

          {error && (
            <div className="mb-6 px-4 py-3 bg-red-900/30 border border-red-800/50 rounded text-red-400 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {mode === "register" && (
              <div>
                <label htmlFor="name" className="block text-dark-muted text-sm mb-1.5">
                  Display Name
                </label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 bg-dark-surface border border-dark-border text-dark-text text-sm placeholder-dark-muted focus:outline-none focus:border-brand transition-colors rounded"
                  placeholder="Your name"
                />
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-dark-muted text-sm mb-1.5">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="w-full px-4 py-3 bg-dark-surface border border-dark-border text-dark-text text-sm placeholder-dark-muted focus:outline-none focus:border-brand transition-colors rounded"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-dark-muted text-sm mb-1.5">
                Password {mode === "register" && <span className="text-dark-muted text-xs">(min 8 characters)</span>}
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                className="w-full px-4 py-3 bg-dark-surface border border-dark-border text-dark-text text-sm placeholder-dark-muted focus:outline-none focus:border-brand transition-colors rounded"
                placeholder={mode === "register" ? "Min 8 characters" : "Your password"}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-brand hover:bg-brand-hover disabled:opacity-50 text-white font-medium rounded transition-colors"
            >
              {loading
                ? (mode === "login" ? "Signing in..." : "Creating account...")
                : (mode === "login" ? "Sign In" : "Create Account")
              }
            </button>
          </form>

          {mode === "login" && (
            <p className="text-center text-dark-muted text-sm mt-6">
              Save events, write reviews, and get personalised recommendations.
            </p>
          )}

          {mode === "register" && (
            <p className="text-center text-dark-muted text-xs mt-6">
              By creating an account you agree to our terms of use. Your saved events will sync across all your devices.
            </p>
          )}
        </div>
      </section>
    </>
  );
}
