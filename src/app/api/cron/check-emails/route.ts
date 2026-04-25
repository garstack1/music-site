import { NextRequest, NextResponse } from "next/server";
import { checkEmails } from "@/lib/email-monitor";

const CRON_SECRET = process.env.CRON_SECRET;

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const providedSecret = authHeader?.replace("Bearer ", "");
  if (CRON_SECRET && providedSecret !== CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await checkEmails();
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    console.error("Email check error:", error);
    return NextResponse.json({ error: "Failed to check emails" }, { status: 500 });
  }
}
