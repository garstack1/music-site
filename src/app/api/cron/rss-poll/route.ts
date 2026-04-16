import { NextRequest, NextResponse } from "next/server";
import { pollAllFeeds } from "@/lib/rss-poller";

const CRON_SECRET = process.env.CRON_SECRET;

export async function POST(request: NextRequest) {
  // Verify secret
  const authHeader = request.headers.get("authorization");
  const providedSecret = authHeader?.replace("Bearer ", "");

  if (CRON_SECRET && providedSecret !== CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const results = await pollAllFeeds();
    
    const totalNew = results.reduce((sum, r) => sum + r.newArticles, 0);
    const totalErrors = results.filter(r => r.error).length;
    
    return NextResponse.json({ 
      success: true, 
      results,
      summary: {
        feedsPolled: results.length,
        newArticles: totalNew,
        errors: totalErrors
      }
    });
  } catch (error) {
    console.error("RSS poll error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Poll failed" },
      { status: 500 }
    );
  }
}

// GET for simple health check
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const providedSecret = authHeader?.replace("Bearer ", "");

  if (CRON_SECRET && providedSecret !== CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json({ status: "ok", endpoint: "rss-poll" });
}
