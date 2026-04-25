import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q")?.trim();
  if (!query || query.length < 2) {
    return NextResponse.json({ news: [], events: [], editorial: [] });
  }

  const session = await getSession();
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

  const editorialContainsAll = searchTerms.map((term) => ({
    OR: [
      { title: { contains: term, mode: "insensitive" as const } },
      { excerpt: { contains: term, mode: "insensitive" as const } },
      { body: { contains: term, mode: "insensitive" as const } },
      { festivalTag: { contains: term, mode: "insensitive" as const } },
      { galleryArtist: { contains: term, mode: "insensitive" as const } },
      { galleryVenue: { contains: term, mode: "insensitive" as const } },
      { galleryEvent: { contains: term, mode: "insensitive" as const } },
    ],
  }));

  const [news, events, editorial] = await Promise.all([
    prisma.newsArticle.findMany({
      where: { hidden: false, AND: containsAll },
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
        ...(session ? {} : { subscriberOnly: false }),
        AND: eventContainsAll,
      },
      orderBy: { date: "asc" },
      take: 10,
    }),
    prisma.editorialPost.findMany({
      where: { status: "PUBLISHED", AND: editorialContainsAll },
      orderBy: { publishedAt: "desc" },
      take: 10,
      select: {
        id: true,
        title: true,
        slug: true,
        type: true,
        excerpt: true,
        coverImage: true,
        festivalTag: true,
        publishedAt: true,
      },
    }),
  ]);

  return NextResponse.json({ news, events, editorial });
}
