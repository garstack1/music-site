import { prisma } from "@/lib/db";

const TICKETMASTER_API_KEY = process.env.TICKETMASTER_API_KEY;
const BASE_URL = "https://app.ticketmaster.com/discovery/v2";

interface TicketmasterPresale {
  name: string;
  description?: string;
  url?: string;
  startDateTime: string;
  endDateTime: string;
}

interface TicketmasterEvent {
  id: string;
  name: string;
  dates: {
    start: {
      localDate: string;
      localTime?: string;
    };
  };
  presales?: TicketmasterPresale[];
  _embedded?: {
    venues?: Array<{
      name: string;
      city?: {
        name: string;
      };
      country?: {
        countryCode: string;
      };
    }>;
  };
}

async function fetchTicketmasterEvents(date: string) {
  try {
    console.log(`Fetching Ticketmaster events for ${date}...`);

    const response = await fetch(
      `${BASE_URL}/events.json?startDateTime=${date}T00:00:00Z&endDateTime=${date}T23:59:59Z&size=200&apikey=${TICKETMASTER_API_KEY}`
    );

    if (!response.ok) {
      throw new Error(`Ticketmaster API error: ${response.status}`);
    }

    const data = await response.json();
    return data._embedded?.events || [];
  } catch (error) {
    console.error("Error fetching from Ticketmaster:", error);
    return [];
  }
}

async function matchEventAndImportPresales(tmEvent: TicketmasterEvent) {
  if (!tmEvent.presales || tmEvent.presales.length === 0) {
    return;
  }

  try {
    // Try to find matching event in our database
    // Match by name and date
    const eventDate = new Date(tmEvent.dates.start.localDate);
    const venueCity = tmEvent._embedded?.venues?.[0]?.city?.name;
    const venueName = tmEvent._embedded?.venues?.[0]?.name;

    console.log(
      `\nProcessing event: ${tmEvent.name} (${venueCity}, ${venueName})`
    );

    // Find event by name and approximate date (within same day)
    const existingEvent = await prisma.event.findFirst({
      where: {
        name: {
          contains: tmEvent.name.substring(0, 30), // Match first 30 chars
          mode: "insensitive",
        },
        date: {
          gte: new Date(eventDate.setHours(0, 0, 0, 0)),
          lt: new Date(eventDate.setHours(23, 59, 59, 999)),
        },
      },
    });

    if (!existingEvent) {
      console.log(`  ⚠ No matching event found in database`);
      return;
    }

    console.log(`  ✓ Found matching event: ${existingEvent.id}`);

    // Import presales for this event
    for (const presale of tmEvent.presales) {
      try {
        const presaleRecord = await prisma.presale.create({
          data: {
            eventId: existingEvent.id,
            name: presale.name,
            description: presale.description || null,
            url: presale.url || null,
            startDateTime: new Date(presale.startDateTime),
            endDateTime: new Date(presale.endDateTime),
          },
        });

        console.log(`    • Added presale: ${presale.name}`);
      } catch (error: any) {
        if (error.code === "P2002") {
          // Unique constraint error - presale already exists
          console.log(`    • Presale already exists: ${presale.name}`);
        } else {
          console.error(`    ✗ Error creating presale:`, error.message);
        }
      }
    }
  } catch (error) {
    console.error(`Error processing event ${tmEvent.name}:`, error);
  }
}

async function main() {
  if (!TICKETMASTER_API_KEY) {
    console.error("❌ TICKETMASTER_API_KEY not set in environment variables");
    process.exit(1);
  }

  const date = "2026-09-01";

  console.log("🎫 Starting Ticketmaster presale import...\n");

  const events = await fetchTicketmasterEvents(date);
  console.log(`Found ${events.length} events on ${date}\n`);

  let presalesImported = 0;
  let eventsWithPresales = 0;

  for (const event of events) {
    if (event.presales && event.presales.length > 0) {
      eventsWithPresales++;
      presalesImported += event.presales.length;
      await matchEventAndImportPresales(event);
    }
  }

  console.log("\n" + "=".repeat(50));
  console.log(`✅ Import complete!`);
  console.log(`   Events with presales: ${eventsWithPresales}`);
  console.log(`   Presales imported: ${presalesImported}`);
  console.log("=".repeat(50));

  await prisma.$disconnect();
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
