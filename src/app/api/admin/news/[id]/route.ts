import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const article = await prisma.newsArticle.findUnique({
    where: { id },
    include: {
      tags: { include: { genre: true } },
      rssFeed: { select: { name: true } },
    },
  });

  if (!article) {
    return NextResponse.json({ error: "Article not found" }, { status: 404 });
  }

  return NextResponse.json({ article });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = await request.json();

    const article = await prisma.newsArticle.findUnique({ where: { id } });
    if (!article) {
      return NextResponse.json({ error: "Article not found" }, { status: 404 });
    }

    const { genreIds, featured, ...updateData } = body;

    // If marking as featured, enforce max 10 featured articles
    if (featured === true && !article.featured) {
      const featuredCount = await prisma.newsArticle.count({
        where: { featured: true },
      });

      if (featuredCount >= 10) {
        // Remove the oldest featured article
        const oldest = await prisma.newsArticle.findFirst({
          where: { featured: true },
          orderBy: { updatedAt: "asc" },
        });

        if (oldest) {
          await prisma.newsArticle.update({
            where: { id: oldest.id },
            data: { featured: false },
          });
        }
      }
    }

    if (genreIds !== undefined) {
      await prisma.articleTag.deleteMany({ where: { articleId: id } });
      if (genreIds.length > 0) {
        await prisma.articleTag.createMany({
          data: genreIds.map((genreId: string) => ({
            articleId: id,
            genreId,
          })),
        });
      }
    }

    const updated = await prisma.newsArticle.update({
      where: { id },
      data: { ...updateData, featured },
      include: {
        tags: { include: { genre: true } },
      },
    });

    return NextResponse.json({ article: updated });
  } catch (error) {
    console.error("Update article error:", error);
    return NextResponse.json(
      { error: "Failed to update article" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;

    const article = await prisma.newsArticle.findUnique({ where: { id } });
    if (!article) {
      return NextResponse.json({ error: "Article not found" }, { status: 404 });
    }

    await prisma.newsArticle.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete article error:", error);
    return NextResponse.json(
      { error: "Failed to delete article" },
      { status: 500 }
    );
  }
}
