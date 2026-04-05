import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    const { eventIds } = await request.json();

    if (!Array.isArray(eventIds) || eventIds.length === 0) {
      return NextResponse.json({ success: true, synced: 0 });
    }

    // Get existing saved events
    const existing = await prisma.savedEvent.findMany({
      where: { userId: session.userId },
      select: { eventId: true },
    });
    const existingIds = new Set(existing.map((e) => e.eventId));

    // Only add new ones
    const newIds = eventIds.filter((id: string) => !existingIds.has(id));

    if (newIds.length > 0) {
      // Verify events exist
      const validEvents = await prisma.event.findMany({
        where: { id: { in: newIds } },
        select: { id: true },
      });
      const validIds = validEvents.map((e) => e.id);

      if (validIds.length > 0) {
        await prisma.savedEvent.createMany({
          data: validIds.map((eventId) => ({
            userId: session.userId,
            eventId,
          })),
          skipDuplicates: true,
        });
      }
    }

    // Return all saved event IDs
    const allSaved = await prisma.savedEvent.findMany({
      where: { userId: session.userId },
      select: { eventId: true },
    });

    return NextResponse.json({
      success: true,
      synced: newIds.length,
      savedEventIds: allSaved.map((s) => s.eventId),
    });
  } catch (error) {
    console.error("Sync error:", error);
    return NextResponse.json({ error: "Failed to sync" }, { status: 500 });
  }
}
