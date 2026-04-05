"use client";

export default function TicketButton({
  eventId,
  ticketUrl,
  className,
}: {
  eventId: string;
  ticketUrl: string;
  className?: string;
}) {
  function handleClick() {
    fetch("/api/track/click", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ eventId }),
    }).catch(() => {});
  }

  return (
    
      href={ticketUrl}
      target="_blank"
      rel="noopener noreferrer"
      onClick={handleClick}
      className={className || "inline-block w-full text-center bg-brand hover:bg-brand-hover text-white px-4 py-2.5 text-sm font-medium tracking-wide transition-colors"}
    >
      Get Tickets {"\u2192"}
    </a>
  );
}
