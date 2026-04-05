"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";

interface User {
  email: string;
  name: string | null;
  role: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (email: string, password: string, name: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: async () => ({ success: false }),
  register: async () => ({ success: false }),
  logout: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const checkSession = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/session");
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkSession();
  }, [checkSession]);

  async function syncLocalStorage() {
    const stored = localStorage.getItem("musicsite_saved_events");
    if (stored) {
      try {
        const eventIds = JSON.parse(stored);
        if (Array.isArray(eventIds) && eventIds.length > 0) {
          await fetch("/api/user/saved-events/sync", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ eventIds }),
          });
          localStorage.removeItem("musicsite_saved_events");
        }
      } catch {
        // ignore
      }
    }
  }

  async function login(email: string, password: string) {
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        return { success: false, error: data.error || "Login failed" };
      }

      setUser(data.user);
      await syncLocalStorage();
      return { success: true };
    } catch {
      return { success: false, error: "Network error" };
    }
  }

  async function register(email: string, password: string, name: string) {
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name }),
      });

      const data = await res.json();

      if (!res.ok) {
        return { success: false, error: data.error || "Registration failed" };
      }

      setUser(data.user);
      await syncLocalStorage();
      return { success: true };
    } catch {
      return { success: false, error: "Network error" };
    }
  }

  async function logout() {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      // ignore
    }
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
