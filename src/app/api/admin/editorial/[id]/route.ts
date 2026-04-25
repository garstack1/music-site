import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const post = await prisma.editorialPost.findUnique({
      where: { id },
      include: {
        socialPosts: true,
        galleryImages: { orderBy: { order: "asc" } },
      },
    });
    if (!post) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ post });
  } catch (error) {
    console.error("GET editorial post error:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const data = await req.json();

    if (data.socialPosts !== undefined) {
      await prisma.socialPost.deleteMany({ where: { postId: id } });
      const validSocial = (data.socialPosts || []).filter(
        (sp: { caption: string; scheduledAt: string }) =>
          sp.caption?.trim() && sp.scheduledAt && !isNaN(new Date(sp.scheduledAt).getTime())
      );
      if (validSocial.length > 0) {
        await prisma.socialPost.createMany({
          data: validSocial.map((sp: { platform: string; caption: string; scheduledAt: string }) => ({
            postId: id,
            platform: sp.platform,
            caption: sp.caption,
            scheduledAt: new Date(sp.scheduledAt),
            status: "PENDING",
          })),
        });
      }
      delete data.socialPosts;
    }

    if (data.galleryImages !== undefined) {
      await prisma.galleryImage.deleteMany({ where: { postId: id } });
      if (data.galleryImages.length > 0) {
        await prisma.galleryImage.createMany({
          data: data.galleryImages.map((img: {
            url: string;
            caption?: string;
            altText?: string;
            tags?: string[];
            shutterSpeed?: string;
            aperture?: string;
            iso?: string;
            order: number;
          }) => ({
            postId: id,
            url: img.url,
            caption: img.caption || null,
            altText: img.altText || null,
            tags: img.tags || [],
            shutterSpeed: img.shutterSpeed || null,
            aperture: img.aperture || null,
            iso: img.iso || null,
            order: img.order,
          })),
        });
      }
      delete data.galleryImages;
    }

    const post = await prisma.editorialPost.update({
      where: { id },
      data: {
        ...data,
        publishedAt: data.publishedAt ? new Date(data.publishedAt) : null,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({ post });
  } catch (error) {
    console.error("PATCH editorial post error:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.editorialPost.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE editorial post error:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
