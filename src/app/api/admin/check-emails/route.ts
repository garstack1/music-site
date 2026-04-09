import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { checkEmails } from "@/lib/email-monitor";

export const maxDuration = 60;

export async function POST() {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await checkEmails();
    return NextResponse.json({ result });
  } catch (error) {
    console.error("Email check error:", error);
    return NextResponse.json({ error: "Failed to check emails" }, { status: 500 });
  }
}
