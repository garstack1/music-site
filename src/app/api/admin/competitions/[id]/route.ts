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
  const competition = await prisma.competition.findUnique({
    where: { id },
    include: {
      entries: {
        include: { user: { select: { name: true, email: true } } },
        orderBy: { createdAt: "desc" },
      },
      winner: { select: { name: true, email: true } },
    },
  });

  if (!competition) {
    return NextResponse.json({ error: "Competition not found" }, { status: 404 });
  }

  return NextResponse.json({ competition });
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

    const competition = await prisma.competition.findUnique({
      where: { id },
      include: { entries: true },
    });

    if (!competition) {
      return NextResponse.json({ error: "Competition not found" }, { status: 404 });
    }

    // Handle draw winner action
    if (body.action === "draw") {
      if (competition.winnerId) {
        return NextResponse.json({ error: "Winner already drawn" }, { status: 400 });
      }

      if (competition.entries.length === 0) {
        return NextResponse.json({ error: "No entries to draw from" }, { status: 400 });
      }

      const randomIndex = Math.floor(Math.random() * competition.entries.length);
      const winnerEntry = competition.entries[randomIndex];

      const updated = await prisma.competition.update({
        where: { id },
        data: {
          winnerId: winnerEntry.userId,
          drawnAt: new Date(),
        },
        include: {
          winner: { select: { name: true, email: true } },
        },
      });

      return NextResponse.json({ competition: updated });
    }

    // Handle release prize action
    if (body.action === "releasePrize") {
      const updated = await prisma.competition.update({
        where: { id },
        data: { prizeReleased: true },
      });
      return NextResponse.json({ competition: updated });
    }

    // Regular update
    const updateData: Record<string, unknown> = {};
    if (body.title !== undefined) updateData.title = body.title;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.prize !== undefined) updateData.prize = body.prize;
    if (body.prizeType !== undefined) updateData.prizeType = body.prizeType;
    if (body.imageUrl !== undefined) updateData.imageUrl = body.imageUrl || null;
    if (body.rules !== undefined) updateData.rules = body.rules || null;
    if (body.startDate !== undefined) updateData.startDate = new Date(body.startDate);
    if (body.endDate !== undefined) updateData.endDate = new Date(body.endDate);
    if (body.maxEntries !== undefined) updateData.maxEntries = body.maxEntries ? parseInt(body.maxEntries) : null;
    if (body.active !== undefined) updateData.active = body.active;

    const updated = await prisma.competition.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ competition: updated });
  } catch (error) {
    console.error("Update competition error:", error);
    return NextResponse.json({ error: "Failed to update competition" }, { status: 500 });
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
    await prisma.competition.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete competition error:", error);
    return NextResponse.json({ error: "Failed to delete competition" }, { status: 500 });
  }
}
