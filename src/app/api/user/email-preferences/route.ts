import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

// GET - Fetch user's email preferences
export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    let preferences = await prisma.emailPreferences.findUnique({
      where: { userId: session.userId },
    });

    // Create default preferences if none exist
    if (!preferences) {
      preferences = await prisma.emailPreferences.create({
        data: {
          userId: session.userId,
          frequency: "NONE",
          includeFeatured: true,
          includePresale: true,
          includeExclusive: true,
          includeCompetitions: true,
        },
      });
    }

    return NextResponse.json({ preferences });
  } catch (error) {
    console.error("Error fetching email preferences:", error);
    return NextResponse.json(
      { error: "Failed to fetch preferences" },
      { status: 500 }
    );
  }
}

// PUT - Update user's email preferences
export async function PUT(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const {
      frequency,
      preferredDay,
      includeFeatured,
      includePresale,
      includeExclusive,
      includeCompetitions,
    } = body;

    // Validate frequency
    const validFrequencies = ["NONE", "DAILY", "WEEKLY", "MONTHLY"];
    if (frequency && !validFrequencies.includes(frequency)) {
      return NextResponse.json(
        { error: "Invalid frequency" },
        { status: 400 }
      );
    }

    // Validate preferredDay
    if (preferredDay !== undefined && preferredDay !== null) {
      if (frequency === "WEEKLY" && (preferredDay < 0 || preferredDay > 6)) {
        return NextResponse.json(
          { error: "Invalid day for weekly frequency (0-6)" },
          { status: 400 }
        );
      }
      if (frequency === "MONTHLY" && (preferredDay < 1 || preferredDay > 28)) {
        return NextResponse.json(
          { error: "Invalid day for monthly frequency (1-28)" },
          { status: 400 }
        );
      }
    }

    const preferences = await prisma.emailPreferences.upsert({
      where: { userId: session.userId },
      update: {
        frequency: frequency || undefined,
        preferredDay: preferredDay !== undefined ? preferredDay : undefined,
        includeFeatured: includeFeatured !== undefined ? includeFeatured : undefined,
        includePresale: includePresale !== undefined ? includePresale : undefined,
        includeExclusive: includeExclusive !== undefined ? includeExclusive : undefined,
        includeCompetitions: includeCompetitions !== undefined ? includeCompetitions : undefined,
        // Clear unsubscribed status if they're updating preferences
        unsubscribedAt: frequency !== "NONE" ? null : undefined,
      },
      create: {
        userId: session.userId,
        frequency: frequency || "NONE",
        preferredDay,
        includeFeatured: includeFeatured ?? true,
        includePresale: includePresale ?? true,
        includeExclusive: includeExclusive ?? true,
        includeCompetitions: includeCompetitions ?? true,
      },
    });

    return NextResponse.json({ preferences });
  } catch (error) {
    console.error("Error updating email preferences:", error);
    return NextResponse.json(
      { error: "Failed to update preferences" },
      { status: 500 }
    );
  }
}
