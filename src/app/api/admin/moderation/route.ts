import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const reviews = await prisma.publicReview.findMany({
    where: { flagged: true },
    orderBy: { createdAt: "desc" },
    include: {
      review: { select: { title: true, artist: true, slug: true } },
      user: { select: { email: true, name: true } },
    },
  });

  return NextResponse.json({ reviews });
}
