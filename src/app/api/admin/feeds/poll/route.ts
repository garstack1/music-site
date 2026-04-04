import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { pollAllFeeds, pollFeed } from "@/lib/rss-poller";

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const feedId = body.feedId as string | undefined;

    if (feedId) {
      const result = await pollFeed(feedId);
      return NextResponse.json({ results: [result] });
    }

    const results = await pollAllFeeds();
    return NextResponse.json({ results });
  } catch (error) {
    console.error("Poll error:", error);
    return NextResponse.json(
      { error: "Failed to poll feeds" },
      { status: 500 }
    );
  }
}
