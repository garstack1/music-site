import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const [articles, editorialPosts] = await Promise.all([
      prisma.newsArticle.findMany({
        where: { hidden: false },
        orderBy: { publishedAt: "desc" },
        include: {
          tags: { include: { genre: true } },
          rssFeed: { select: { id: true, name: true } },
        },
      }),
      prisma.editorialPost.findMany({
        where: {
          status: "PUBLISHED",
          showInNews: true,
        },
        orderBy: { publishedAt: "desc" },
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

    // Convert editorial posts to a compatible shape with a marker
    const teasers = editorialPosts.map((p) => ({
      ...p,
      _isEditorial: true,
      publishedAt: p.publishedAt?.toISOString() || new Date().toISOString(),
    }));

    return NextResponse.json({ articles, teasers });
  } catch (error) {
    console.error("Failed to fetch news:", error);
    return NextResponse.json(
      { error: "Failed to fetch news" },
      { status: 500 }
    );
  }
}
