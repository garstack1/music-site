import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  const setting = await prisma.siteSetting.findUnique({
    where: { key: "competitions_enabled" },
  });

  if (setting?.value !== "true") {
    return NextResponse.json({ enabled: false, competitions: [] });
  }

  const now = new Date();

  const competitions = await prisma.competition.findMany({
    where: {
      active: true,
      startDate: { lte: now },
    },
    orderBy: { endDate: "asc" },
    include: {
      _count: { select: { entries: true } },
      winner: { select: { name: true } },
    },
  });

  return NextResponse.json({ enabled: true, competitions });
}
