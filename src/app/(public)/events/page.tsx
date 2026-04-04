import { prisma } from "@/lib/db";
import SaveEventButton from "@/components/events/SaveEventButton";

export const metadata = {
  title: "Events - MusicSite",
  description: "Upcoming concerts and festivals",
};

async function getEvents() {
  return prisma.event.findMany({
    where: { active: true, date: { gte: new Date() } },
    orderBy: { date: "asc" },
  });
}

function TicketLink({ url }: { url: string }) {
  return (
    <span
      dangerouslySetInnerHTML={{
        __html: `<a href="${url}" target="_blank" rel="noopener noreferrer" class="inline-block bg-brand hover:bg-brand-hover text-white px-4 py-2 text-xs font-medium tracking-wide transition-colors">Get Tickets →</a>`,
      }}
    />
  );
}

export default async function EventsPage() {
  const events = await getEvents();
  const concerts = events.filter((e) => e.type === "CONCERT");
  const festivals = events.filter((e) => e.type === "FESTIVAL");

  return (
    <>
      <section className="bg-dark-bg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <h1 className="text-dark-text text-3xl md:text-4xl font-bold">Events</h1>
          <p className="text-dark-muted mt-2">Upcoming concerts and festivals across Ireland, the UK and Europe.</p>
          <div className="flex gap-4 mt-6">
            <span className="text-dark-text text-sm border-b-2 border-brand pb-2">All</span>
            <span className="text-dark-muted text-sm pb-2 hover:text-dark-text cursor-pointer transition-colors">
              Concerts ({concerts.length})
            </span>
            <span className="text-dark-muted text-sm pb-2 hover:text-dark-text cursor-pointer transition-colors">
              Festivals ({festivals.length})
            </span>
          </div>
        </div>
      </section>

      {/* Festivals Section */}
      {festivals.length > 0 && (
        <section className="bg-light-surface">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <h2 className="text-xl font-bold mb-6">
              <span className="text-brand">Festivals</span> across Europe
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {festivals.map((event) => (
                <div
                  key={event.id}
                  className="bg-light-bg border border-light-border p-6 hover:border-brand transition-colors relative"
                >
                  <div className="absolute top-4 right-4">
                    <SaveEventButton eventId={event.id} />
                  </div>
                  <span className="text-brand text-xs font-medium tracking-widest uppercase">
                    Festival
                  </span>
                  <h3 className="text-lg font-bold mt-2 pr-8">{event.name}</h3>
                  <p className="text-light-muted text-sm mt-1">{event.venue}</p>
                  <p className="text-light-muted text-sm">
                    {event.city}, {event.country}
                  </p>
                  <div className="flex items-center gap-2 mt-3 text-sm">
                    <span className="font-medium">
                      {new Date(event.date).toLocaleDateString("en-IE", {
                        day: "numeric", month: "short",
                      })}
                    </span>
                    {event.endDate && (
                      <>
                        <span className="text-light-muted">{"—"}</span>
                        <span className="font-medium">
                          {new Date(event.endDate).toLocaleDateString("en-IE", {
                            day: "numeric", month: "short", year: "numeric",
                          })}
                        </span>
                      </>
                    )}
                  </div>
                  {event.description && (
                    <p className="text-light-muted text-sm mt-3 line-clamp-2">
                      {event.description}
                    </p>
                  )}
                  {event.ticketUrl && (
                    <div className="mt-4">
                      <TicketLink url={event.ticketUrl} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Concerts Section */}
      {concerts.length > 0 && (
        <section className="bg-light-bg">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <h2 className="text-xl font-bold mb-6">
              <span className="text-brand">Concerts</span> in Ireland & UK
            </h2>
            <div className="space-y-4">
              {concerts.map((event) => (
                <div
                  key={event.id}
                  className="flex items-center gap-6 border-b border-light-border pb-4 group"
                >
                  <div className="text-center w-16 shrink-0">
                    <div className="text-2xl font-bold text-brand">
                      {new Date(event.date).getDate()}
                    </div>
                    <div className="text-xs text-light-muted uppercase">
                      {new Date(event.date).toLocaleDateString("en-IE", { month: "short" })}
                    </div>
                  </div>

                  <div className="flex-1">
                    <h3 className="font-semibold group-hover:text-brand transition-colors">
                      {event.name}
                    </h3>
                    <p className="text-light-muted text-sm">
                      {event.venue} {"—"} {event.city}, {event.country}
                    </p>
                    {event.genre && (
                      <span className="text-xs bg-light-surface text-light-muted px-2 py-1 mt-1 inline-block">
                        {event.genre}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <SaveEventButton eventId={event.id} />
                    {event.ticketUrl && (
                      <div className="hidden sm:block">
                        <TicketLink url={event.ticketUrl} />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
