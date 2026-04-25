import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

const CRON_SECRET = process.env.CRON_SECRET;

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const providedSecret = authHeader?.replace("Bearer ", "");
  if (CRON_SECRET && providedSecret !== CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const now = new Date();

    // Find all scheduled posts whose publish time has passed
    const due = await prisma.editorialPost.findMany({
      where: {
        status: "SCHEDULED",
        publishedAt: { lte: now },
      },
      select: { id: true, title: true, publishedAt: true },
    });

    if (due.length === 0) {
      return NextResponse.json({
        success: true,
        published: 0,
        message: "No scheduled posts due",
      });
    }

    // Publish them all
    const ids = due.map((p) => p.id);
    await prisma.editorialPost.updateMany({
      where: { id: { in: ids } },
      data: { status: "PUBLISHED" },
    });

    console.log(`Published ${due.length} scheduled posts:`, due.map((p) => p.title));

    return NextResponse.json({
      success: true,
      published: due.length,
      posts: due.map((p) => ({ id: p.id, title: p.title, publishedAt: p.publishedAt })),
    });
  } catch (error) {
    console.error("Failed to publish scheduled posts:", error);
    return NextResponse.json({ error: "Failed to publish scheduled posts" }, { status: 500 });
  }
}
