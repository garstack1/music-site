import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sources = await prisma.csvSource.findMany({
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ sources });
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { name, url } = await request.json();

    if (!name || !url) {
      return NextResponse.json({ error: "Name and URL are required" }, { status: 400 });
    }

    const existing = await prisma.csvSource.findUnique({ where: { url } });
    if (existing) {
      return NextResponse.json({ error: "A source with this URL already exists" }, { status: 409 });
    }

    const source = await prisma.csvSource.create({
      data: { name, url, active: true },
    });

    return NextResponse.json({ source }, { status: 201 });
  } catch (error) {
    console.error("Create CSV source error:", error);
    return NextResponse.json({ error: "Failed to create source" }, { status: 500 });
  }
}
