import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  const ids = request.nextUrl.searchParams.get("ids");

  if (!ids) {
    return NextResponse.json({ events: [] });
  }

  const idList = ids.split(",").filter(Boolean);

  if (idList.length === 0) {
    return NextResponse.json({ events: [] });
  }

  const events = await prisma.event.findMany({
    where: {
      id: { in: idList },
      active: true,
    },
    orderBy: { date: "asc" },
  });

  return NextResponse.json({ events });
}
