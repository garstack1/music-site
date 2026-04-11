import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

const SETTINGS_KEYS = [
  "ticketmaster_auto_enabled",
  "ticketmaster_auto_frequency", // "hourly", "daily", "weekly"
  "ticketmaster_auto_hour", // 0-23 for daily/weekly
  "ticketmaster_auto_day", // 0-6 (Sunday-Saturday) for weekly
  "ticketmaster_auto_last_run",
];

// GET - Fetch all Ticketmaster automation settings
export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const settings = await prisma.siteSetting.findMany({
      where: { key: { in: SETTINGS_KEYS } },
    });

    const result: Record<string, string | null> = {};
    for (const key of SETTINGS_KEYS) {
      const setting = settings.find((s) => s.key === key);
      result[key] = setting?.value || null;
    }

    // Get recent import logs
    const recentLogs = await prisma.importLog.findMany({
      where: { type: { startsWith: "ticketmaster" } },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    return NextResponse.json({ settings: result, recentLogs });
  } catch (error) {
    console.error("Error fetching settings:", error);
    return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 });
  }
}

// PUT - Update Ticketmaster automation settings
export async function PUT(request: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { enabled, frequency, hour, day } = body;

    // Validate inputs
    if (typeof enabled !== "boolean") {
      return NextResponse.json({ error: "Invalid enabled value" }, { status: 400 });
    }

    if (frequency && !["hourly", "daily", "weekly"].includes(frequency)) {
      return NextResponse.json({ error: "Invalid frequency" }, { status: 400 });
    }

    if (hour !== undefined && (hour < 0 || hour > 23)) {
      return NextResponse.json({ error: "Invalid hour (0-23)" }, { status: 400 });
    }

    if (day !== undefined && (day < 0 || day > 6)) {
      return NextResponse.json({ error: "Invalid day (0-6)" }, { status: 400 });
    }

    // Update settings
    const updates = [
      { key: "ticketmaster_auto_enabled", value: enabled ? "true" : "false" },
    ];

    if (frequency) {
      updates.push({ key: "ticketmaster_auto_frequency", value: frequency });
    }

    if (hour !== undefined) {
      updates.push({ key: "ticketmaster_auto_hour", value: String(hour) });
    }

    if (day !== undefined) {
      updates.push({ key: "ticketmaster_auto_day", value: String(day) });
    }

    for (const { key, value } of updates) {
      await prisma.siteSetting.upsert({
        where: { key },
        update: { value },
        create: { key, value },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating settings:", error);
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 });
  }
}
