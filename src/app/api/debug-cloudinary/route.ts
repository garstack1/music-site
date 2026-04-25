import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME ? "SET" : "NOT SET",
    api_key: process.env.CLOUDINARY_API_KEY ? "SET" : "NOT SET",
    api_secret: process.env.CLOUDINARY_API_SECRET ? "SET" : "NOT SET",
  });
}
