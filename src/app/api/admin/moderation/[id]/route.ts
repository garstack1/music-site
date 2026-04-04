import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

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
    const { action } = await request.json();

    const review = await prisma.publicReview.findUnique({ where: { id } });
    if (!review) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 });
    }

    if (action === "approve") {
      const updated = await prisma.publicReview.update({
        where: { id },
        data: { flagged: false, approved: true },
      });
      return NextResponse.json({ review: updated });
    }

    if (action === "reject") {
      const updated = await prisma.publicReview.update({
        where: { id },
        data: { flagged: false, approved: false },
      });
      return NextResponse.json({ review: updated });
    }

    if (action === "delete") {
      await prisma.publicReview.delete({ where: { id } });
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Moderation error:", error);
    return NextResponse.json(
      { error: "Failed to process action" },
      { status: 500 }
    );
  }
}
