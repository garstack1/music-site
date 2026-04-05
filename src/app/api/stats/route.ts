import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  const [
    totalEvents,
    totalArticles,
    totalReviews,
    totalTicketClicks,
    artists,
    cities,
    countries,
    setting,
  ] = await Promise.all([
    prisma.event.count({ where: { active: true } }),
    prisma.newsArticle.count({ where: { hidden: false } }),
    prisma.review.count({ where: { status: "PUBLISHED" } }),
    prisma.ticketClick.count(),
    prisma.event.findMany({
      where: { active: true, artist: { not: null } },
      select: { artist: true },
      distinct: ["artist"],
    }),
    prisma.event.findMany({
      where: { active: true, city: { not: null } },
      select: { city: true },
      distinct: ["city"],
    }),
    prisma.event.findMany({
      where: { active: true },
      select: { country: true },
      distinct: ["country"],
    }),
    prisma.siteSetting.findUnique({
      where: { key: "stats_section_enabled" },
    }),
  ]);

  return NextResponse.json({
    enabled: setting?.value === "true",
    stats: {
      totalEvents,
      totalArticles,
      totalReviews,
      totalTicketClicks,
      totalArtists: artists.length,
      totalCities: cities.length,
      totalCountries: countries.length,
    },
  });
}
