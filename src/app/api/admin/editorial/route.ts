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

    // DEBUG - remove after fixing
    console.log("Gallery images received:", JSON.stringify(data.galleryImages));
    console.log("Gallery style received:", data.galleryStyle);

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

    const validGalleryImages = (data.galleryImages || []).filter(
      (img: { url: string }) => img.url && img.url.trim()
    );

    console.log("Valid gallery images:", validGalleryImages.length);

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
        galleryStyle: data.galleryStyle || "MASONRY",
        socialPosts: validSocialPosts.length > 0 ? {
          create: validSocialPosts.map((sp: {
            platform: string;
            caption: string;
            scheduledAt: string;
          }) => ({
            platform: sp.platform,
            caption: sp.caption,
            scheduledAt: new Date(sp.scheduledAt),
            status: "PENDING",
          })),
        } : undefined,
        galleryImages: validGalleryImages.length > 0 ? {
          create: validGalleryImages.map((img: {
            url: string;
            caption?: string;
            altText?: string;
            tags?: string[];
            shutterSpeed?: string;
            aperture?: string;
            iso?: string;
            order: number;
          }) => ({
            url: img.url,
            caption: img.caption || null,
            altText: img.altText || null,
            tags: img.tags || [],
            shutterSpeed: img.shutterSpeed || null,
            aperture: img.aperture || null,
            iso: img.iso || null,
            order: img.order || 0,
          })),
        } : undefined,
      },
    });

    return NextResponse.json({ post });
  } catch (error) {
    console.error("Editorial post creation error:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
