import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

const PUBLIC_SETTINGS = [
  "public_reviews_enabled",
  "stats_section_enabled",
  "competitions_enabled",
  "email_preferences_enabled",
  "site_name",
];

export async function GET() {
  try {
    const settings = await prisma.siteSetting.findMany({
      where: {
        key: { in: PUBLIC_SETTINGS },
      },
    });
    const settingsMap: Record<string, string> = {};
    for (const s of settings) {
      settingsMap[s.key] = s.value;
    }
    return NextResponse.json({ settings: settingsMap });
  } catch (error) {
    console.error("Error fetching public settings:", error);
    return NextResponse.json({ settings: {} });
  }
}
