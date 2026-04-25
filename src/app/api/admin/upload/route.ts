import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const files = formData.getAll("photos") as File[];
    const folder = (formData.get("folder") as string) || "general";
    const subfolder = (formData.get("subfolder") as string) || `upload-${Date.now()}`;

    if (!files || files.length === 0) {
      return NextResponse.json({ error: "No files provided" }, { status: 400 });
    }

    const cloudinaryFolder = `musicsite/${folder}/${subfolder}`;
    const uploaded: string[] = [];

    for (const file of files) {
      if (!file.type.startsWith("image/")) continue;
      if (file.size > 10 * 1024 * 1024) continue;

      const buffer = Buffer.from(await file.arrayBuffer());

      const result = await new Promise<{ secure_url: string }>((resolve, reject) => {
        cloudinary.uploader.upload_stream(
          {
            folder: cloudinaryFolder,
            resource_type: "image",
            transformation: [
              { quality: "auto", fetch_format: "auto" },
            ],
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result as { secure_url: string });
          }
        ).end(buffer);
      });

      uploaded.push(result.secure_url);
    }

    if (uploaded.length === 0) {
      return NextResponse.json(
        { error: "No valid images uploaded. Max 10MB, images only." },
        { status: 400 }
      );
    }

    return NextResponse.json({ urls: uploaded });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Failed to upload files" }, { status: 500 });
  }
}
