import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type");
    const festivalTag = searchParams.get("festivalTag");
    const category = searchParams.get("category");
    const limit = parseInt(searchParams.get("limit") || "20");

    const where: Record<string, unknown> = {
      status: "PUBLISHED",
    };

    if (type) where.type = type;
    if (festivalTag) where.festivalTag = festivalTag;
    if (category === "FESTIVALS") {
      where.type = { in: ["FESTIVAL_PREVIEW", "FESTIVAL_UPDATE", "FESTIVAL_RECAP"] };
    }
    if (category === "FEATURES") {
      where.type = { in: ["FEATURE", "CONCERT_REVIEW"] };
    }

    const posts = await prisma.editorialPost.findMany({
      where,
      orderBy: { publishedAt: "desc" },
      take: limit,
      select: {
        id: true,
        title: true,
        slug: true,
        type: true,
        excerpt: true,
        coverImage: true,
        festivalTag: true,
        publishedAt: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ posts });
  } catch {
    return NextResponse.json({ error: "Failed to fetch posts" }, { status: 500 });
  }
}
