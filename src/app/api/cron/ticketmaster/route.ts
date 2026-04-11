import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { importAllEvents } from "@/lib/ticketmaster";

const CRON_SECRET = process.env.CRON_SECRET;

// Helper to get setting value
async function getSetting(key: string): Promise<string | null> {
  const setting = await prisma.siteSetting.findUnique({ where: { key } });
  return setting?.value || null;
}

// Check if automation should run based on settings
async function shouldRunAutomation(): Promise<{ shouldRun: boolean; reason: string }> {
  const enabled = await getSetting("ticketmaster_auto_enabled");
  if (enabled !== "true") {
    return { shouldRun: false, reason: "Automation is disabled" };
  }

  const frequency = await getSetting("ticketmaster_auto_frequency");
  const lastRun = await getSetting("ticketmaster_auto_last_run");
  
  if(!frequency) {
    return { shouldRun: false, reason: "No frequency set" };
  }

  const now = new Date();
  
  // If never run before, run now
  if (!lastRun) {
    return { shouldRun: true, reason: "First run" };
  }

  const lastRunDate = new Date(lastRun);
  const hoursSinceLastRun = (now.getTime() - lastRunDate.getTime()) / (1000 * 60 * 60);

  // Check based on frequency
  switch (frequency) {
    case "hourly":
      if (hoursSinceLastRun >= 1) {
        return { shouldRun: true, reason: "Hourly schedule" };
      }
      break;
    case "daily":
      const scheduledHour = parseInt(await getSetting("ticketmaster_auto_hour") || "3");
      if (hoursSinceLastRun >= 20 && now.getHours() === scheduledHour) {
        return { shouldRun: true, reason: "Daily schedule" };
      }
      break;
    case "weekly":
      const scheduledDay = parseInt(await getSetting("ticketmaster_auto_day") || "0");
      const scheduledHourWeekly = parseInt(await getSetting("ticketmaster_auto_hour") || "3");
      if (hoursSinceLastRun >= 144 && now.getDay() === scheduledDay && now.getHours() === scheduledHourWeekly) {
        return { shouldRun: true, reason: "Weekly schedule" };
      }
      break;
  }

  return { shouldRun: false, reason: `Not yet time (last run: ${lastRun})` };
}

// POST - Manual trigger or cron trigger with force option
// GET - Cron trigger (checks schedule)
export async function GET(request: NextRequest) {
  // Verify cron secret if provided
  const authHeader = request.headers.get("authorization");
  const urlSecret = request.nextUrl.searchParams.get("secret");
  const providedSecret = authHeader?.replace("Bearer ", "") || urlSecret;

  if (CRON_SECRET && providedSecret !== CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check if automation should run
  const { shouldRun, reason } = await shouldRunAutomation();
  
  if (!shouldRun) {
    return NextResponse.json({ 
      success: true, 
      skipped: true, 
      reason 
    });
  }

  // Run the import
  return runImport("cron");
}

export async function POST(request: NextRequest) {
  // Verify cron secret if provided
  const authHeader = request.headers.get("authorization");
  const providedSecret = authHeader?.replace("Bearer ", "");

  if (CRON_SECRET && providedSecret !== CRON_SECRET) {
    // Check if it's an admin session instead
    const { getSession } = await import("@/lib/auth");
    const session = await getSession();
    if(!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const body = await request.json().catch(() => ({}));
  const triggeredBy = body.triggeredBy || "manual";
  const force = body.force === true;

  // If not forced, check schedule
  if (!force) {
    const { shouldRun, reason } = await shouldRunAutomation();
    if (!shouldRun) {
      return NextResponse.json({ 
        success: true, 
        skipped: true, 
        reason 
      });
    }
  }

  return runImport(triggeredBy);
}

async function runImport(triggeredBy: string): Promise<NextResponse> {
  const startTime = Date.now();
  
  try {
    // Run the import
    const results = await importAllEvents();
    
    // Calculate totals
    const totals = {
      created: 0,
      updated: 0,
      skipped: 0,
      errors: [] as string[],
    };
    
    for (const result of results) {
      totals.created += result.imported;
      totals.updated += result.updated;
      totals.skipped += result.skipped;
      totals.errors.push(...result.errors);
    }

    const duration = Date.now() - startTime;
    const status = totals.errors.length > 0 ? "partial" : "success";

    // Log the import
    await prisma.importLog.create({
      data: {
        type: "ticketmaster_auto",
        status,
        eventsCreated: totals.created,
        eventsUpdated: totals.updated,
        eventsSkipped: totals.skipped,
        errors: totals.errors.length > 0 ? JSON.stringify(totals.errors) : null,
        duration,
        triggeredBy,
        details: JSON.stringify(results.map(r => ({
          country: r.country,
          type: r.type,
          fetched: r.fetched,
          imported: r.imported,
          updated: r.updated,
          skipped: r.skipped,
        }))),
      },
    });

    // Update last run time
    await prisma.siteSetting.upsert({
      where: { key: "ticketmaster_auto_last_run" },
      update: { value: new Date().toISOString() },
      create: { key: "ticketmaster_auto_last_run", value: new Date().toISOString() },
    });

    return NextResponse.json({
      success: true,
      status,
      duration,
      totals,
      results: results.map(r => ({
        country: r.country,
        type: r.type,
        fetched: r.fetched,
        imported: r.imported,
        updated: r.updated,
        skipped: r.skipped,
        errors: r.errors.length,
      })),
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : "Unknown error";

    // Log the failed import
    await prisma.importLog.create({
      data: {
        type: "ticketmaster_auto",
        status: "failed",
        eventsCreated: 0,
        eventsUpdated: 0,
        eventsSkipped: 0,
        errors: JSON.stringify([errorMessage]),
        duration,
        triggeredBy,
      },
    });

    return NextResponse.json({
      success: false,
      error: errorMessage,
      duration,
    }, { status: 500 });
  }
}
