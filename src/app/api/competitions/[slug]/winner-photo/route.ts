import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import crypto from "crypto";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    const { slug } = await params;

    const competition = await prisma.competition.findUnique({ where: { slug } });
    if (!competition) {
      return NextResponse.json({ error: "Competition not found" }, { status: 404 });
    }

    if (competition.winnerId !== session.userId) {
      return NextResponse.json({ error: "Only the winner can upload a photo" }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get("photo") as File;
    if (!file || !file.type.startsWith("image/")) {
      return NextResponse.json({ error: "Valid image file required" }, { status: 400 });
    }

    const uploadDir = path.join(process.cwd(), "public", "uploads", "winners");
    await mkdir(uploadDir, { recursive: true });

    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const hash = crypto.randomBytes(8).toString("hex");
    const filename = `${Date.now()}-${hash}.${ext}`;

    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(path.join(uploadDir, filename), buffer);

    const photoUrl = `/uploads/winners/${filename}`;

    await prisma.competition.update({
      where: { id: competition.id },
      data: { winnerPhoto: photoUrl },
    });

    return NextResponse.json({ success: true, photoUrl });
  } catch (error) {
    console.error("Winner photo upload error:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
