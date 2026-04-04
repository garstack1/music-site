import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  const events = await prisma.event.findMany({
    where: { active: true, date: { gte: new Date() } },
    orderBy: { date: "asc" },
  });

  const genres = [...new Set(events.map((e) => e.genre).filter(Boolean))] as string[];
  const cities = [...new Set(
    events
      .filter((e) => e.type === "CONCERT" && (e.country === "IE" || e.country === "GB"))
      .map((e) => e.city)
      .filter(Boolean)
  )] as string[];

  return NextResponse.json({ events, genres, cities });
}
