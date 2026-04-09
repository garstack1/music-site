import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const senders = await prisma.approvedSender.findMany({
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ senders });
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { name, email, startMarker, endMarker, sourceLabel, gmailLabel, autoPublish } = await request.json();

    if (!name || !email) {
      return NextResponse.json({ error: "Name and email are required" }, { status: 400 });
    }

    const existing = await prisma.approvedSender.findUnique({ where: { email: email.toLowerCase() } });
    if (existing) {
      return NextResponse.json({ error: "This sender already exists" }, { status: 409 });
    }

    const sender = await prisma.approvedSender.create({
      data: {
        name,
        email: email.toLowerCase(),
        startMarker: startMarker || "",
        endMarker: endMarker || "",
        gmailLabel: gmailLabel || null,
        autoPublish: autoPublish || false,
      },
    });

    // Update with sourceLabel if provided and column exists
    if (sourceLabel) {
      try {
        const updated = await prisma.approvedSender.update({
          where: { id: sender.id },
          data: { sourceLabel },
        });
        return NextResponse.json({ sender: updated }, { status: 201 });
      } catch {
        // sourceLabel column might not exist yet, return sender without it
        return NextResponse.json({ sender }, { status: 201 });
      }
    }

    return NextResponse.json({ sender }, { status: 201 });
  } catch (error) {
    console.error("Create sender error:", error);
    return NextResponse.json({ error: "Failed to create sender" }, { status: 500 });
  }
}
