"use client";

import { useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "musicsite_saved_events";

export function useSavedEvents() {
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    async function init() {
      // Check if user is logged in
      try {
        const res = await fetch("/api/user/saved-events");
        const data = await res.json();
        if (data.savedEventIds && data.savedEventIds.length >= 0) {
          // User might be logged in — check if we got real data
          const sessionRes = await fetch("/api/auth/session");
          if (sessionRes.ok) {
            setIsLoggedIn(true);
            setSavedIds(data.savedEventIds);
            setLoaded(true);
            return;
          }
        }
      } catch {
        // not logged in
      }

      // Fall back to localStorage
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          setSavedIds(JSON.parse(stored));
        }
      } catch {
        // ignore
      }
      setLoaded(true);
    }

    init();
  }, []);

  const save = useCallback(
    async (id: string) => {
      setSavedIds((prev) => {
        const next = [...prev, id];
        if (!isLoggedIn) {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        }
        return next;
      });

      if (isLoggedIn) {
        fetch("/api/user/saved-events", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ eventId: id, action: "save" }),
        }).catch(() => {});
      }
    },
    [isLoggedIn]
  );

  const unsave = useCallback(
    async (id: string) => {
      setSavedIds((prev) => {
        const next = prev.filter((i) => i !== id);
        if (!isLoggedIn) {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        }
        return next;
      });

      if (isLoggedIn) {
        fetch("/api/user/saved-events", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ eventId: id, action: "unsave" }),
        }).catch(() => {});
      }
    },
    [isLoggedIn]
  );

  const toggle = useCallback(
    (id: string) => {
      if (savedIds.includes(id)) {
        unsave(id);
      } else {
        save(id);
      }
    },
    [savedIds, save, unsave]
  );

  const isSaved = useCallback(
    (id: string) => savedIds.includes(id),
    [savedIds]
  );

  return { savedIds, loaded, save, unsave, toggle, isSaved, isLoggedIn };
}
