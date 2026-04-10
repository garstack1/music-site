import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { sendEmail } from "@/lib/email-service";
import { generateDigestEmail } from "@/lib/email-templates";

// Protect with a secret key
const CRON_SECRET = process.env.CRON_SECRET;
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export const maxDuration = 300; // 5 minutes max for batch sending

export async function GET(request: NextRequest) {
  // Verify the request is from an authorized source
  const authHeader = request.headers.get("authorization");
  const cronSecret = request.nextUrl.searchParams.get("secret");
  
  if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}` && cronSecret !== CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const currentDay = now.getDay(); // 0-6 (Sunday-Saturday)
  const currentDate = now.getDate(); // 1-31

  try {
    // Find users who should receive emails today
    const usersToEmail = await prisma.emailPreferences.findMany({
      where: {
        unsubscribedAt: null,
        OR: [
          // Daily subscribers
          { frequency: "DAILY" },
          // Weekly subscribers on their preferred day
          { 
            frequency: "WEEKLY",
            preferredDay: currentDay,
          },
          // Monthly subscribers on their preferred date
          {
            frequency: "MONTHLY",
            preferredDay: currentDate,
          },
        ],
        // Don't send if already sent today
        OR: [
          { lastSentAt: null },
          { lastSentAt: { lt: new Date(now.getFullYear(), now.getMonth(), now.getDate()) } },
        ],
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            blocked: true,
          },
        },
      },
    });

    // Filter out blocked users
    const activeUsers = usersToEmail.filter(p => !p.user.blocked);

    if (activeUsers.length === 0) {
      return NextResponse.json({ 
        message: "No users to email today",
        checked: usersToEmail.length,
      });
    }

    // Fetch content for the digest
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const threeMonthsFromNow = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);

    // Fetch events with presales
    const [featuredEvents, presaleEvents, exclusiveEvents, competitions] = await Promise.all([
      // Featured events (upcoming)
      prisma.event.findMany({
        where: {
          active: true,
          featured: true,
          date: { gte: now, lte: threeMonthsFromNow },
        },
        include: { presales: true },
        orderBy: { date: "asc" },
        take: 5,
      }),
      // Events with upcoming presales
      prisma.event.findMany({
        where: {
          active: true,
          date: { gte: now },
          presales: {
            some: {
              startDateTime: { gte: now },
              endDateTime: { gte: now },
            },
          },
        },
        include: {
          presales: {
            where: {
              startDateTime: { gte: oneWeekAgo },
              endDateTime: { gte: now },
            },
            orderBy: { startDateTime: "asc" },
          },
        },
        orderBy: { date: "asc" },
        take: 5,
      }),
      // Exclusive/subscriber-only events
      prisma.event.findMany({
        where: {
          active: true,
          subscriberOnly: true,
          date: { gte: now },
        },
        include: { presales: true },
        orderBy: { date: "asc" },
        take: 5,
      }),
      // Active competitions
      prisma.competition.findMany({
        where: {
          active: true,
          endDate: { gte: now },
          startDate: { lte: now },
        },
        orderBy: { endDate: "asc" },
        take: 3,
      }),
    ]);

    // Send emails
    const results = {
      total: activeUsers.length,
      sent: 0,
      failed: 0,
      errors: [] as string[],
    };

    for (const prefs of activeUsers) {
      try {
        // Build content based on user preferences
        const content = {
          featuredEvents: prefs.includeFeatured ? featuredEvents : [],
          presaleEvents: prefs.includePresale ? presaleEvents : [],
          exclusiveEvents: prefs.includeExclusive ? exclusiveEvents : [],
          competitions: prefs.includeCompetitions ? competitions : [],
        };

        // Skip if no content to send
        const hasContent = 
          content.featuredEvents.length > 0 ||
          content.presaleEvents.length > 0 ||
          content.exclusiveEvents.length > 0 ||
          content.competitions.length > 0;

        if (!hasContent) {
          continue;
        }

        // Generate email
        const { html, text, subject } = generateDigestEmail({
          recipientName: prefs.user.name,
          content,
          unsubscribeUrl: `${SITE_URL}/api/unsubscribe?token=${prefs.unsubscribeToken}`,
          preferencesUrl: `${SITE_URL}/account/preferences`,
          frequency: prefs.frequency as "DAILY" | "WEEKLY" | "MONTHLY",
          siteUrl: SITE_URL,
        });

        // Send email
        const result = await sendEmail({
          to: prefs.user.email,
          subject,
          html,
          text,
        });

        if (result.success) {
          results.sent++;
          
          // Update lastSentAt
          await prisma.emailPreferences.update({
            where: { id: prefs.id },
            data: { lastSentAt: now },
          });
        } else {
          results.failed++;
          results.errors.push(`${prefs.user.email}: ${result.error}`);
        }

        // Rate limiting - 100ms delay between emails
        await new Promise((r) => setTimeout(r, 100));
      } catch (error) {
        results.failed++;
        results.errors.push(`${prefs.user.email}: ${error instanceof Error ? error.message : "Unknown error"}`);
      }
    }

    return NextResponse.json({
      message: "Email sending complete",
      results,
    });
  } catch (error) {
    console.error("Cron email error:", error);
    return NextResponse.json(
      { error: "Failed to send emails", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

// Also allow POST for manual triggering from admin
export async function POST(request: NextRequest) {
  return GET(request);
}
