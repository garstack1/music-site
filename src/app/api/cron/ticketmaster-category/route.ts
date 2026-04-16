import { NextRequest, NextResponse } from "next/server";
import { importCategory, getAllCategories, type ImportCategory } from "@/lib/ticketmaster";

const CRON_SECRET = process.env.CRON_SECRET;

export async function POST(request: NextRequest) {
  // Verify secret
  const authHeader = request.headers.get("authorization");
  const providedSecret = authHeader?.replace("Bearer ", "");

  if (CRON_SECRET && providedSecret !== CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const category = body.category as ImportCategory;

  if (!category) {
    return NextResponse.json({ error: "Missing category" }, { status: 400 });
  }

  try {
    const result = await importCategory(category);
    return NextResponse.json({ success: true, result });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Import failed" },
      { status: 500 }
    );
  }
}

// GET endpoint to list all categories
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const providedSecret = authHeader?.replace("Bearer ", "");

  if (CRON_SECRET && providedSecret !== CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json({ categories: getAllCategories() });
}
