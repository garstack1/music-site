import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { importCsvSource, importAllCsvSources } from "@/lib/csv-importer";

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const sourceId = body.sourceId as string | undefined;

    if (sourceId) {
      const result = await importCsvSource(sourceId);
      return NextResponse.json({ results: [result] });
    }

    const results = await importAllCsvSources();
    return NextResponse.json({ results });
  } catch (error) {
    console.error("CSV import error:", error);
    return NextResponse.json({ error: "Failed to import" }, { status: 500 });
  }
}
