import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const articles = await prisma.newsArticle.findMany({
      where: { hidden: false },
      orderBy: { publishedAt: "desc" },
      include: {
        tags: { include: { genre: true } },
        rssFeed: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json(articles);
  } catch (error) {
    console.error("Failed to fetch news:", error);
    return NextResponse.json(
      { error: "Failed to fetch news" },
      { status: 500 }
    );
  }
}
