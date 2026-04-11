import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  const now = new Date();
  
  const events = await prisma.event.findMany({
    where: { active: true, date: { gte: now } },
    orderBy: { date: "asc" },
    include: {
      presales: {
        orderBy: { startDateTime: "asc" },
      },
    },
  });

  // Get events with active presales (at least one presale end date in the future)
  const presaleEvents = events.filter((e) => 
    e.presales && e.presales.length > 0 && 
    e.presales.some((p) => new Date(p.endDateTime) > now)
  );

  const genres = [...new Set(events.map((e) => e.genre).filter(Boolean))] as string[];
  const cities = [...new Set(
    events
      .filter((e) => e.type === "CONCERT" && (e.country === "IE" || e.country === "GB"))
      .map((e) => e.city)
      .filter(Boolean)
  )] as string[];

  return NextResponse.json({ events, presaleEvents, genres, cities });
}
