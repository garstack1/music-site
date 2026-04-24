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
      include: { socialPosts: true },
    });
    if (!post) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ post });
  } catch {
    return NextResponse.json({ error: "Failed to fetch post" }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const data = await req.json();

    // Handle social posts if provided
    if (data.socialPosts) {
      await prisma.socialPost.deleteMany({ where: { postId: id } });
      if (data.socialPosts.length > 0) {
        await prisma.socialPost.createMany({
          data: data.socialPosts.map((sp: {
            platform: string;
            caption: string;
            scheduledAt: string;
          }) => ({
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

    const post = await prisma.editorialPost.update({
      where: { id },
      data: {
        ...data,
        publishedAt: data.publishedAt ? new Date(data.publishedAt) : null,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({ post });
  } catch {
    return NextResponse.json({ error: "Failed to update post" }, { status: 500 });
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
  } catch {
    return NextResponse.json({ error: "Failed to delete post" }, { status: 500 });
  }
}
