"use client";

import { useSavedEvents } from "@/hooks/useSavedEvents";

export default function SaveEventButton({ eventId }: { eventId: string }) {
  const { toggle, isSaved, loaded } = useSavedEvents();

  if (!loaded) return null;

  const saved = isSaved(eventId);

  return (
    <button
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggle(eventId);
      }}
      title={saved ? "Remove from saved" : "Save event"}
      className="group/save p-1.5 transition-colors"
    >
      <svg
        className={`w-5 h-5 transition-colors ${
          saved
            ? "fill-brand text-brand"
            : "fill-none text-light-muted hover:text-brand"
        }`}
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
        />
      </svg>
    </button>
  );
}
