import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const reviews = await prisma.review.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      photos: { orderBy: { sortOrder: "asc" } },
      _count: { select: { publicReviews: true } },
    },
  });

  return NextResponse.json({ reviews });
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 100);
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { title, artist, venue, city, eventDate, setlist, body, status, photoUrls, coverImage } =
      await request.json();

    if (!title || !artist || !venue || !eventDate || !body) {
      return NextResponse.json(
        { error: "Title, artist, venue, date and body are required" },
        { status: 400 }
      );
    }

    let slug = slugify(`${artist}-${venue}-${title}`);
    const existingSlug = await prisma.review.findUnique({ where: { slug } });
    if (existingSlug) {
      slug = `${slug}-${Date.now().toString(36)}`;
    }

    const review = await prisma.review.create({
      data: {
        title,
        slug,
        artist,
        venue,
        city: city || null,
        eventDate: new Date(eventDate),
        setlist: setlist || null,
        body,
        coverImage: coverImage || null,
        status: status || "DRAFT",
        publishedAt: status === "PUBLISHED" ? new Date() : null,
        photos:
          photoUrls && photoUrls.length > 0
            ? {
                create: photoUrls.map((url: string, i: number) => ({
                  url,
                  sortOrder: i,
                })),
              }
            : undefined,
      },
    });

    return NextResponse.json({ review }, { status: 201 });
  } catch (error) {
    console.error("Create review error:", error);
    return NextResponse.json(
      { error: "Failed to create review" },
      { status: 500 }
    );
  }
}
