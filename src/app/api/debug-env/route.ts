import { NextResponse } from "next/server";

export async function GET() {
  const url = process.env.DATABASE_URL || "NOT SET";
  const masked = url.substring(0, 50) + "...";
  return NextResponse.json({ 
    database_url_start: masked,
    has_database_url: !!process.env.DATABASE_URL
  });
}
