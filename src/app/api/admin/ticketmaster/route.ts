import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { importAllEvents } from "@/lib/ticketmaster";

export const maxDuration = 60;

export async function POST() {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const results = await importAllEvents();
    return NextResponse.json({ results });
  } catch (error) {
    console.error("Ticketmaster import error:", error);
    return NextResponse.json(
      { error: "Failed to import events" },
      { status: 500 }
    );
  }
}
