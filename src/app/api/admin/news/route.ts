import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const articles = await prisma.newsArticle.findMany({
    orderBy: { publishedAt: "desc" },
    include: {
      tags: { include: { genre: true } },
      rssFeed: { select: { name: true } },
    },
  });

  return NextResponse.json({ articles });
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
    const { title, summary, body, sourceUrl, imageUrl, featured, genreIds } =
      await request.json();

    if (!title || !sourceUrl) {
      return NextResponse.json(
        { error: "Title and source URL are required" },
        { status: 400 }
      );
    }

    let slug = slugify(title);
    const existingSlug = await prisma.newsArticle.findUnique({
      where: { slug },
    });
    if (existingSlug) {
      slug = `${slug}-${Date.now().toString(36)}`;
    }

    const existingUrl = await prisma.newsArticle.findUnique({
      where: { sourceUrl },
    });
    if (existingUrl) {
      return NextResponse.json(
        { error: "An article with this source URL already exists" },
        { status: 409 }
      );
    }

    const article = await prisma.newsArticle.create({
      data: {
        title,
        slug,
        summary: summary || null,
        body: body || null,
        sourceUrl,
        imageUrl: imageUrl || null,
        featured: featured || false,
        manual: true,
        publishedAt: new Date(),
        tags:
          genreIds && genreIds.length > 0
            ? {
                create: genreIds.map((genreId: string) => ({
                  genreId,
                })),
              }
            : undefined,
      },
    });

    return NextResponse.json({ article }, { status: 201 });
  } catch (error) {
    console.error("Create article error:", error);
    return NextResponse.json(
      { error: "Failed to create article" },
      { status: 500 }
    );
  }
}
