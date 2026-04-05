import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const competitions = await prisma.competition.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { entries: true } },
      winner: { select: { name: true, email: true } },
    },
  });

  return NextResponse.json({ competitions });
}

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 100);
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { title, description, prize, prizeType, imageUrl, rules, startDate, endDate, maxEntries } = await request.json();

    if (!title || !description || !prize || !startDate || !endDate) {
      return NextResponse.json({ error: "Title, description, prize, start date, and end date are required" }, { status: 400 });
    }

    let slug = slugify(title);
    const existingSlug = await prisma.competition.findUnique({ where: { slug } });
    if (existingSlug) {
      slug = `${slug}-${Date.now().toString(36)}`;
    }

    const competition = await prisma.competition.create({
      data: {
        title,
        slug,
        description,
        prize,
        prizeType: prizeType || "TICKETS",
        imageUrl: imageUrl || null,
        rules: rules || null,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        maxEntries: maxEntries ? parseInt(maxEntries) : null,
        active: true,
      },
    });

    return NextResponse.json({ competition }, { status: 201 });
  } catch (error) {
    console.error("Create competition error:", error);
    return NextResponse.json({ error: "Failed to create competition" }, { status: 500 });
  }
}
