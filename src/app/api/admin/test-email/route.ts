import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { sendEmail } from "@/lib/email-service";
import { generateDigestEmail } from "@/lib/email-templates";
import { prisma } from "@/lib/db";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json({ error: "Email address required" }, { status: 400 });
    }

    // Fetch some real data for the test email
    const now = new Date();
    const threeMonthsFromNow = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);

    const [featuredEvents, presaleEvents, exclusiveEvents, competitions] = await Promise.all([
      prisma.event.findMany({
        where: {
          active: true,
          featured: true,
          date: { gte: now, lte: threeMonthsFromNow },
        },
        include: { presales: true },
        orderBy: { date: "asc" },
        take: 3,
      }),
      prisma.event.findMany({
        where: {
          active: true,
          date: { gte: now },
          presales: { some: {} },
        },
        include: { presales: { orderBy: { startDateTime: "asc" }, take: 2 } },
        orderBy: { date: "asc" },
        take: 3,
      }),
      prisma.event.findMany({
        where: {
          active: true,
          subscriberOnly: true,
          date: { gte: now },
        },
        include: { presales: true },
        orderBy: { date: "asc" },
        take: 3,
      }),
      prisma.competition.findMany({
        where: {
          active: true,
          endDate: { gte: now },
          startDate: { lte: now },
        },
        orderBy: { endDate: "asc" },
        take: 2,
      }),
    ]);

    // Generate the email
    const { html, text, subject } = generateDigestEmail({
      recipientName: "Test User",
      content: {
        featuredEvents,
        presaleEvents,
        exclusiveEvents,
        competitions,
      },
      unsubscribeUrl: `${SITE_URL}/api/unsubscribe?token=test-token`,
      preferencesUrl: `${SITE_URL}/account/preferences`,
      frequency: "WEEKLY",
      siteUrl: SITE_URL,
    });

    // Send the test email
    const result = await sendEmail({
      to: email,
      subject: `[TEST] ${subject}`,
      html,
      text,
    });

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: `Test email sent to ${email}`,
        messageId: result.messageId,
        contentSummary: {
          featuredEvents: featuredEvents.length,
          presaleEvents: presaleEvents.length,
          exclusiveEvents: exclusiveEvents.length,
          competitions: competitions.length,
        },
      });
    } else {
      return NextResponse.json({
        success: false,
        error: result.error,
      }, { status: 500 });
    }
  } catch (error) {
    console.error("Test email error:", error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }, { status: 500 });
  }
}
