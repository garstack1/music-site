import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const events = await prisma.event.findMany({
    orderBy: { date: "desc" },
  });

  return NextResponse.json({ events });
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { name, type, artist, venue, city, country, date, endDate, ticketUrl, description, imageUrl, genre } = body;

    if (!name || !type || !country || !date) {
      return NextResponse.json(
        { error: "Name, type, country and date are required" },
        { status: 400 }
      );
    }

    const normalised = [artist, venue, city, date].filter(Boolean).join("-").toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const fingerprint = `manual-${normalised}`;

    const existing = await prisma.event.findUnique({ where: { fingerprint } });
    if (existing) {
      return NextResponse.json(
        { error: "A similar event already exists (duplicate fingerprint)" },
        { status: 409 }
      );
    }

    const event = await prisma.event.create({
      data: {
        name,
        type,
        artist: artist || null,
        venue: venue || null,
        city: city || null,
        country,
        date: new Date(date),
        endDate: endDate ? new Date(endDate) : null,
        ticketUrl: ticketUrl || null,
        description: description || null,
        imageUrl: imageUrl || null,
        genre: genre || null,
        source: "MANUAL",
        fingerprint,
        active: true,
      },
    });

    return NextResponse.json({ event }, { status: 201 });
  } catch (error) {
    console.error("Create event error:", error);
    return NextResponse.json(
      { error: "Failed to create event" },
      { status: 500 }
    );
  }
}
