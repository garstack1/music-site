import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import type { FestivalResult } from "../route";

// POST - Import selected festivals as draft events
export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { festivals, publishImmediately = false } = body as {
      festivals: FestivalResult[];
      publishImmediately?: boolean;
    };

    if (!festivals || !Array.isArray(festivals) || festivals.length === 0) {
      return NextResponse.json({ error: "No festivals to import" }, { status: 400 });
    }

    const results = {
      imported: 0,
      skipped: 0,
      errors: [] as string[],
    };

    for (const festival of festivals) {
      try {
        // Create fingerprint for deduplication
        const fingerprint = createFingerprint(festival);

        // Check if already exists
        const existing = await prisma.event.findUnique({
          where: { fingerprint },
        });

        if (existing) {
          results.skipped++;
          continue;
        }

        // Parse dates
        const startDate = festival.startDate ? new Date(festival.startDate) : new Date();
        const endDate = festival.endDate ? new Date(festival.endDate) : null;

        // Build description with lineup if available
        let description = festival.description || "";
        if (festival.lineup && festival.lineup.length > 0) {
          description += description ? "\n\n" : "";
          description += `Lineup: ${festival.lineup.join(", ")}`;
        }

        // Create the event
        await prisma.event.create({
          data: {
            name: festival.name,
            type: "FESTIVAL",
            venue: festival.venue,
            city: festival.city,
            country: festival.country || "IE",
            date: startDate,
            endDate: endDate,
            ticketUrl: festival.ticketUrl,
            description: description || null,
            imageUrl: festival.imageUrl,
            genre: festival.genre,
            artistWebsite: festival.websiteUrl,
            latitude: festival.latitude,
            longitude: festival.longitude,
            source: "WEB_SCRAPE",
            sourceId: festival.source,
            fingerprint: fingerprint,
            active: publishImmediately,
            featured: false,
          },
        });

        results.imported++;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : "Unknown error";
        results.errors.push(`${festival.name}: ${errorMsg}`);
      }
    }

    return NextResponse.json({
      success: true,
      results,
      message: `Imported ${results.imported} festivals, skipped ${results.skipped} duplicates`,
    });
  } catch (error) {
    console.error("Festival import error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Import failed" },
      { status: 500 }
    );
  }
}

function createFingerprint(festival: FestivalResult): string {
  // Create a unique fingerprint based on name, venue, and date
  const parts = [
    "web",
    festival.name?.toLowerCase().replace(/[^a-z0-9]/g, "") || "",
    festival.venue?.toLowerCase().replace(/[^a-z0-9]/g, "") || "",
    festival.city?.toLowerCase().replace(/[^a-z0-9]/g, "") || "",
    festival.startDate || "",
  ];
  return parts.join("-");
}
