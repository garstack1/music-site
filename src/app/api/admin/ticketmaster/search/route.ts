import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { searchAndImportEvents } from "@/lib/ticketmaster";

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { keyword, countryCode = "IE" } = body;

    if (!keyword) {
      return NextResponse.json({ error: "Keyword is required" }, { status: 400 });
    }

    const result = await searchAndImportEvents(keyword, countryCode);
    return NextResponse.json({ result });
  } catch (error) {
    console.error("Ticketmaster search import error:", error);
    return NextResponse.json(
      { error: "Failed to search and import events" },
      { status: 500 }
    );
  }
}
