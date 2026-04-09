import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const feeds = await prisma.rssFeed.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { articles: true } } },
  });

  return NextResponse.json({ feeds });
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { name, url, sourceLabel } = await request.json();

    if (!name || !url) {
      return NextResponse.json(
        { error: "Name and URL are required" },
        { status: 400 }
      );
    }

    try {
      new URL(url);
    } catch {
      return NextResponse.json(
        { error: "Invalid URL format" },
        { status: 400 }
      );
    }

    const existing = await prisma.rssFeed.findUnique({ where: { url } });
    if (existing) {
      return NextResponse.json(
        { error: "A feed with this URL already exists" },
        { status: 409 }
      );
    }

    const feed = await prisma.rssFeed.create({
      data: { 
        name, 
        url, 
        sourceLabel: sourceLabel || null,
        active: true 
      },
    });

    return NextResponse.json({ feed }, { status: 201 });
  } catch (error) {
    console.error("Create feed error:", error);
    return NextResponse.json(
      { error: "Failed to create feed" },
      { status: 500 }
    );
  }
}
