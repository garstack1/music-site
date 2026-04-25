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

    const baseSlug = data.slug || data.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    let slug = baseSlug;
    const existing = await prisma.editorialPost.findUnique({ where: { slug } });
    if (existing) {
      slug = baseSlug + "-" + Date.now();
    }

    const validSocialPosts = (data.socialPosts || []).filter(
      (sp: { platform: string; caption: string; scheduledAt: string }) =>
        sp.caption && sp.caption.trim() && sp.scheduledAt && !isNaN(new Date(sp.scheduledAt).getTime())
    );

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
        socialPosts: validSocialPosts.length > 0 ? {
          create: validSocialPosts.map((sp: { platform: string; caption: string; scheduledAt: string }) => ({
            platform: sp.platform,
            caption: sp.caption,
            scheduledAt: new Date(sp.scheduledAt),
            status: "PENDING",
          })),
        } : undefined,
      },
    });

    return NextResponse.json({ post });
  } catch (error) {
    console.error("Editorial post creation error:", error);
    return NextResponse.json({ error: "Failed to create post" }, { status: 500 });
  }
}
