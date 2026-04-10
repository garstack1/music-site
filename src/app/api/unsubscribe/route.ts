import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET - Unsubscribe via token (from email link)
export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");

  if (!token) {
    return NextResponse.json({ error: "Token required" }, { status: 400 });
  }

  try {
    const preferences = await prisma.emailPreferences.findUnique({
      where: { unsubscribeToken: token },
    });

    if (!preferences) {
      return NextResponse.json({ error: "Invalid token" }, { status: 404 });
    }

    await prisma.emailPreferences.update({
      where: { id: preferences.id },
      data: {
        frequency: "NONE",
        unsubscribedAt: new Date(),
      },
    });

    // Redirect to a confirmation page
    return NextResponse.redirect(new URL("/unsubscribed", request.url));
  } catch (error) {
    console.error("Error unsubscribing:", error);
    return NextResponse.json(
      { error: "Failed to unsubscribe" },
      { status: 500 }
    );
  }
}
