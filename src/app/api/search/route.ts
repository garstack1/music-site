import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q")?.trim();

  if (!query || query.length < 2) {
    return NextResponse.json({ news: [], events: [], reviews: [] });
  }

  const searchTerms = query.split(/\s+/).filter(Boolean);
  const containsAll = searchTerms.map((term) => ({
    OR: [
      { title: { contains: term, mode: "insensitive" as const } },
      { summary: { contains: term, mode: "insensitive" as const } },
    ],
  }));

  const eventContainsAll = searchTerms.map((term) => ({
    OR: [
      { name: { contains: term, mode: "insensitive" as const } },
      { artist: { contains: term, mode: "insensitive" as const } },
      { venue: { contains: term, mode: "insensitive" as const } },
      { city: { contains: term, mode: "insensitive" as const } },
      { genre: { contains: term, mode: "insensitive" as const } },
    ],
  }));

  const reviewContainsAll = searchTerms.map((term) => ({
    OR: [
      { title: { contains: term, mode: "insensitive" as const } },
      { artist: { contains: term, mode: "insensitive" as const } },
      { venue: { contains: term, mode: "insensitive" as const } },
      { body: { contains: term, mode: "insensitive" as const } },
    ],
  }));

  const [news, events, reviews] = await Promise.all([
    prisma.newsArticle.findMany({
      where: {
        hidden: false,
        AND: containsAll,
      },
      orderBy: { publishedAt: "desc" },
      take: 10,
      include: {
        tags: { include: { genre: true } },
        rssFeed: { select: { name: true } },
      },
    }),
    prisma.event.findMany({
      where: {
        active: true,
        AND: eventContainsAll,
      },
      orderBy: { date: "asc" },
      take: 10,
    }),
    prisma.review.findMany({
      where: {
        status: "PUBLISHED",
        AND: reviewContainsAll,
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
  ]);

  return NextResponse.json({ news, events, reviews });
}
