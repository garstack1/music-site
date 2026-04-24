import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const posts = await prisma.editorialPost.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        slug: true,
        type: true,
        status: true,
        showInNews: true,
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

export async function POST(req: Request) {
  try {
    const data = await req.json();

    const slug = data.slug || data.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    const post = await prisma.editorialPost.create({
      data: {
        title: data.title,
        slug,
        type: data.type,
        excerpt: data.excerpt || null,
        body: data.body || "",
        coverImage: data.coverImage || null,
        socialImage: data.socialImage || null,
        status: data.status || "DRAFT",
        publishedAt: data.publishedAt ? new Date(data.publishedAt) : null,
        showInNews: data.showInNews || false,
        festivalTag: data.festivalTag || null,
      },
    });

    return NextResponse.json({ post });
  } catch {
    return NextResponse.json({ error: "Failed to create post" }, { status: 500 });
  }
}
