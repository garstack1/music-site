import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const [total, daily, weekly, monthly, none, recentlySent] = await Promise.all([
      // Total subscribers (excluding NONE)
      prisma.emailPreferences.count({
        where: {
          frequency: { not: "NONE" },
          unsubscribedAt: null,
        },
      }),
      // Daily subscribers
      prisma.emailPreferences.count({
        where: {
          frequency: "DAILY",
          unsubscribedAt: null,
        },
      }),
      // Weekly subscribers
      prisma.emailPreferences.count({
        where: {
          frequency: "WEEKLY",
          unsubscribedAt: null,
        },
      }),
      // Monthly subscribers
      prisma.emailPreferences.count({
        where: {
          frequency: "MONTHLY",
          unsubscribedAt: null,
        },
      }),
      // Unsubscribed or no emails
      prisma.emailPreferences.count({
        where: {
          OR: [
            { frequency: "NONE" },
            { unsubscribedAt: { not: null } },
          ],
        },
      }),
      // Sent today
      prisma.emailPreferences.count({
        where: {
          lastSentAt: { gte: todayStart },
        },
      }),
    ]);

    return NextResponse.json({
      stats: {
        total,
        daily,
        weekly,
        monthly,
        none,
        recentlySent,
      },
    });
  } catch (error) {
    console.error("Error fetching subscriber stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch stats" },
      { status: 500 }
    );
  }
}
