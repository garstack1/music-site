"use client";

import { useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "musicsite_saved_events";

export function useSavedEvents() {
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setSavedIds(JSON.parse(stored));
      }
    } catch {
      // ignore
    }
    setLoaded(true);
  }, []);

  const save = useCallback((id: string) => {
    setSavedIds((prev) => {
      const next = [...prev, id];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const unsave = useCallback((id: string) => {
    setSavedIds((prev) => {
      const next = prev.filter((i) => i !== id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

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

  return { savedIds, loaded, save, unsave, toggle, isSaved };
}
