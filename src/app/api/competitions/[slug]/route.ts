import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const session = await getSession();

  const competition = await prisma.competition.findUnique({
    where: { slug },
    include: {
      _count: { select: { entries: true } },
      winner: { select: { name: true } },
    },
  });

  if (!competition || !competition.active) {
    return NextResponse.json({ error: "Competition not found" }, { status: 404 });
  }

  let hasEntered = false;
  if (session) {
    const entry = await prisma.competitionEntry.findUnique({
      where: {
        competitionId_userId: {
          competitionId: competition.id,
          userId: session.userId,
        },
      },
    });
    hasEntered = !!entry;
  }

  return NextResponse.json({ competition, hasEntered });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "You must be signed in to enter" }, { status: 401 });
  }

  try {
    const { slug } = await params;
    const { agreedToTerms } = await request.json();

    if (!agreedToTerms) {
      return NextResponse.json({ error: "You must agree to the terms to enter" }, { status: 400 });
    }

    const competition = await prisma.competition.findUnique({
      where: { slug },
      include: { _count: { select: { entries: true } } },
    });

    if (!competition || !competition.active) {
      return NextResponse.json({ error: "Competition not found" }, { status: 404 });
    }

    const now = new Date();
    if (now < competition.startDate) {
      return NextResponse.json({ error: "Competition has not started yet" }, { status: 400 });
    }
    if (now > competition.endDate) {
      return NextResponse.json({ error: "Competition has ended" }, { status: 400 });
    }

    if (competition.maxEntries && competition._count.entries >= competition.maxEntries) {
      return NextResponse.json({ error: "Competition is full" }, { status: 400 });
    }

    const existing = await prisma.competitionEntry.findUnique({
      where: {
        competitionId_userId: {
          competitionId: competition.id,
          userId: session.userId,
        },
      },
    });

    if (existing) {
      return NextResponse.json({ error: "You have already entered this competition" }, { status: 409 });
    }

    await prisma.competitionEntry.create({
      data: {
        competitionId: competition.id,
        userId: session.userId,
        agreedToTerms: true,
      },
    });

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error("Competition entry error:", error);
    return NextResponse.json({ error: "Failed to enter competition" }, { status: 500 });
  }
}
