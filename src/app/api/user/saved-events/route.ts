import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ savedEventIds: [] });
  }

  const saved = await prisma.savedEvent.findMany({
    where: { userId: session.userId },
    select: { eventId: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({
    savedEventIds: saved.map((s) => s.eventId),
  });
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    const { eventId, action } = await request.json();

    if (!eventId) {
      return NextResponse.json({ error: "Event ID required" }, { status: 400 });
    }

    if (action === "unsave") {
      await prisma.savedEvent.deleteMany({
        where: { userId: session.userId, eventId },
      });
      return NextResponse.json({ success: true, saved: false });
    }

    // Save
    const existing = await prisma.savedEvent.findUnique({
      where: {
        userId_eventId: {
          userId: session.userId,
          eventId,
        },
      },
    });

    if (!existing) {
      await prisma.savedEvent.create({
        data: { userId: session.userId, eventId },
      });
    }

    return NextResponse.json({ success: true, saved: true });
  } catch (error) {
    console.error("Save event error:", error);
    return NextResponse.json({ error: "Failed to save event" }, { status: 500 });
  }
}
