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

  const review = await prisma.review.findUnique({
    where: { id },
    include: {
      photos: { orderBy: { sortOrder: "asc" } },
    },
  });

  if (!review) {
    return NextResponse.json({ error: "Review not found" }, { status: 404 });
  }

  return NextResponse.json({ review });
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

    const review = await prisma.review.findUnique({ where: { id } });
    if (!review) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 });
    }

    const { photoUrls, ...updateData } = body;

    if (updateData.eventDate) {
      updateData.eventDate = new Date(updateData.eventDate);
    }

    if (updateData.status === "PUBLISHED" && review.status !== "PUBLISHED") {
      updateData.publishedAt = new Date();
    }
    if (updateData.status === "DRAFT") {
      updateData.publishedAt = null;
    }

    if (updateData.setlist === "") updateData.setlist = null;
    if (updateData.city === "") updateData.city = null;
    if (updateData.coverImage === "") updateData.coverImage = null;

    if (photoUrls !== undefined) {
      await prisma.reviewPhoto.deleteMany({ where: { reviewId: id } });
      if (photoUrls.length > 0) {
        await prisma.reviewPhoto.createMany({
          data: photoUrls.map((url: string, i: number) => ({
            reviewId: id,
            url,
            sortOrder: i,
          })),
        });
      }
    }

    const updated = await prisma.review.update({
      where: { id },
      data: updateData,
      include: {
        photos: { orderBy: { sortOrder: "asc" } },
      },
    });

    return NextResponse.json({ review: updated });
  } catch (error) {
    console.error("Update review error:", error);
    return NextResponse.json(
      { error: "Failed to update review" },
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

    const review = await prisma.review.findUnique({ where: { id } });
    if (!review) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 });
    }

    await prisma.review.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete review error:", error);
    return NextResponse.json(
      { error: "Failed to delete review" },
      { status: 500 }
    );
  }
}
