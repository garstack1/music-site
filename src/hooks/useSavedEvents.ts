"use client";

import { useState, useEffect, useCallback, useRef } from "react";

const STORAGE_KEY = "musicsite_saved_events";

let globalSavedIds: string[] = [];
let globalLoaded = false;
let globalIsLoggedIn = false;
let globalListeners: Set<() => void> = new Set();
let initPromise: Promise<void> | null = null;

function notifyListeners() {
  globalListeners.forEach((fn) => fn());
}

async function initSavedEvents() {
  if (globalLoaded) return;

  try {
    const sessionRes = await fetch("/api/auth/session");
    if (sessionRes.ok) {
      globalIsLoggedIn = true;
      const res = await fetch("/api/user/saved-events");
      const data = await res.json();
      globalSavedIds = data.savedEventIds || [];
    } else {
      globalIsLoggedIn = false;
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        globalSavedIds = JSON.parse(stored);
      }
    }
  } catch {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        globalSavedIds = JSON.parse(stored);
      }
    } catch {
      // ignore
    }
  }

  globalLoaded = true;
  notifyListeners();
}

export function useSavedEvents() {
  const [, forceUpdate] = useState(0);

  useEffect(() => {
    const listener = () => forceUpdate((n) => n + 1);
    globalListeners.add(listener);

    if (!initPromise) {
      initPromise = initSavedEvents();
    }

    return () => {
      globalListeners.delete(listener);
    };
  }, []);

  const save = useCallback(async (id: string) => {
    if (globalSavedIds.includes(id)) return;
    globalSavedIds = [...globalSavedIds, id];
    notifyListeners();

    if (globalIsLoggedIn) {
      fetch("/api/user/saved-events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId: id, action: "save" }),
      }).catch(() => {});
    } else {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(globalSavedIds));
    }
  }, []);

  const unsave = useCallback(async (id: string) => {
    globalSavedIds = globalSavedIds.filter((i) => i !== id);
    notifyListeners();

    if (globalIsLoggedIn) {
      fetch("/api/user/saved-events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId: id, action: "unsave" }),
      }).catch(() => {});
    } else {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(globalSavedIds));
    }
  }, []);

  const toggle = useCallback((id: string) => {
    if (globalSavedIds.includes(id)) {
      unsave(id);
    } else {
      save(id);
    }
  }, [save, unsave]);

  const isSaved = useCallback((id: string) => globalSavedIds.includes(id), []);

  return {
    savedIds: globalSavedIds,
    loaded: globalLoaded,
    save,
    unsave,
    toggle,
    isSaved,
    isLoggedIn: globalIsLoggedIn,
  };
}
