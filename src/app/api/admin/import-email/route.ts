import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 100);
}

function extractBetweenMarkers(text: string, startMarker: string, endMarker: string): string {
  let content = text;
  if (startMarker) {
    const startIdx = content.indexOf(startMarker);
    if (startIdx !== -1) {
      content = content.substring(startIdx + startMarker.length);
    }
  }
  if (endMarker) {
    const endIdx = content.indexOf(endMarker);
    if (endIdx !== -1) {
      content = content.substring(0, endIdx);
    }
  }
  return content.trim();
}

function autoExtractContent(text: string): string {
  let content = text;
  const startMarkers = ["===", "---", "***", "PRESS RELEASE", "FOR IMMEDIATE RELEASE"];
  const endMarkers = ["******", "** PRESS **", "PRESS CONTACT", "FOR MORE INFORMATION", "ENDS", "###"];

  for (const marker of startMarkers) {
    const idx = content.indexOf(marker);
    if (idx !== -1 && idx < content.length / 3) {
      content = content.substring(idx + marker.length);
      break;
    }
  }

  for (const marker of endMarkers) {
    const idx = content.lastIndexOf(marker);
    if (idx !== -1 && idx > content.length / 2) {
      content = content.substring(0, idx);
      break;
    }
  }

  return content.trim();
}

function extractTitle(content: string): string {
  const lines = content.split("\n").map((l) => l.trim()).filter(Boolean);

  for (const line of lines.slice(0, 10)) {
    const cleaned = line.replace(/[^a-zA-Z\s']/g, "").trim();
    if (cleaned.length > 5 && cleaned.length < 100 && cleaned === cleaned.toUpperCase()) {
      return line.replace(/\*+/g, "").trim();
    }
  }

  for (const line of lines) {
    if (line.length > 10 && !line.startsWith("Photo") && !line.startsWith("http")) {
      return line.slice(0, 150);
    }
  }

  return "Untitled Press Release";
}

function extractSummary(content: string): string {
  const lines = content.split("\n").map((l) => l.trim()).filter(Boolean);

  for (const line of lines) {
    if (line.length > 80 && line !== line.toUpperCase() && !line.startsWith("http") && !line.startsWith("Watch") && !line.startsWith("Photo")) {
      const sentences = line.match(/[^.!?]+[.!?]+/g);
      if (sentences && sentences.length >= 2) {
        return sentences.slice(0, 2).join("").trim();
      }
      return line.slice(0, 300);
    }
  }

  return content.slice(0, 300);
}

function extractImages(fullEmail: string): string[] {
  const images: string[] = [];
  const imgRegex = /https?:\/\/[^\s<>"]+\.(jpg|jpeg|png|gif|webp)(\?[^\s<>"]*)?/gi;
  let match;
  while ((match = imgRegex.exec(fullEmail)) !== null) {
    if (!images.includes(match[0])) {
      images.push(match[0]);
    }
  }
  return images;
}

function extractVideos(fullEmail: string): string[] {
  const videos: string[] = [];
  const ytRegex = /https?:\/\/(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)[^\s<>"]+/gi;
  let match;
  while ((match = ytRegex.exec(fullEmail)) !== null) {
    if (!videos.includes(match[0])) videos.push(match[0]);
  }
  const vimeoRegex = /https?:\/\/(www\.)?vimeo\.com\/[^\s<>"]+/gi;
  while ((match = vimeoRegex.exec(fullEmail)) !== null) {
    if (!videos.includes(match[0])) videos.push(match[0]);
  }
  return videos;
}

function extractQuotes(content: string): string[] {
  const quoteRegex = /[\u201C""]([^"\u201D\u201C]{20,})[\u201D""]/g;
  const quotes: string[] = [];
  let match;
  while ((match = quoteRegex.exec(content)) !== null) {
    quotes.push(match[1].trim());
  }
  return quotes;
}

function extractUrls(text: string): { website: string | null; social: Record<string, string> } {
  const urlRegex = /https?:\/\/[^\s<>"]+/g;
  const urls = text.match(urlRegex) || [];
  let website: string | null = null;
  const social: Record<string, string> = {};
  const skipDomains = ["sonicpr", "mailto", "youtube", "youtu.be", "vimeo", "jpg", "jpeg", "png", "gif", "webp"];

  for (const url of urls) {
    const lower = url.toLowerCase();
    if (lower.includes("twitter.com") || lower.includes("x.com")) social.twitter = url;
    else if (lower.includes("instagram.com")) social.instagram = url;
    else if (lower.includes("facebook.com")) social.facebook = url;
    else if (lower.includes("spotify.com")) social.spotify = url;
    else if (lower.includes("tiktok.com")) social.tiktok = url;
    else if (!website && !skipDomains.some((d) => lower.includes(d))) website = url;
  }

  return { website, social };
}

function buildBodyWithMedia(content: string, videos: string[]): string {
  let body = content;
  if (videos.length > 0) {
    body += "\n\n---\n\n";
    videos.forEach((url) => {
      const platform = url.includes("vimeo") ? "Vimeo" : "YouTube";
      body += `Watch on ${platform}: ${url}\n`;
    });
  }
  return body;
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { emailText, startMarker, endMarker, mode, editedTitle, editedSummary } = await request.json();

    if (!emailText) {
      return NextResponse.json({ error: "Email text is required" }, { status: 400 });
    }

    let content: string;
    if (startMarker || endMarker) {
      content = extractBetweenMarkers(emailText, startMarker || "", endMarker || "");
    } else {
      content = autoExtractContent(emailText);
    }

    if (!content || content.length < 20) {
      return NextResponse.json({ error: "Could not extract meaningful content" }, { status: 400 });
    }

    const title = extractTitle(content);
    const summary = extractSummary(content);
    const quotes = extractQuotes(content);
    const images = extractImages(emailText);
    const videos = extractVideos(emailText);
    const { website, social } = extractUrls(emailText);
    const body = buildBodyWithMedia(content, videos);
    const featuredImage = images.length > 0 ? images[0] : null;

    if (mode === "preview") {
      return NextResponse.json({
        preview: { title, summary, body, quotes, images, videos, featuredImage, sourceUrl: website, social },
      });
    }

    const finalTitle = editedTitle || title;
    const finalSummary = editedSummary || summary;

    let slug = slugify(finalTitle);
    const existingSlug = await prisma.newsArticle.findUnique({ where: { slug } });
    if (existingSlug) {
      slug = `${slug}-${Date.now().toString(36)}`;
    }

    const sourceUrl = website || `pr-import-${Date.now()}`;
    const existingUrl = await prisma.newsArticle.findFirst({ where: { sourceUrl } });
    if (existingUrl) {
      return NextResponse.json({ error: "This article may already exist" }, { status: 409 });
    }

    const article = await prisma.newsArticle.create({
      data: {
        title: finalTitle,
        slug,
        summary: finalSummary,
        body,
        sourceUrl,
        imageUrl: featuredImage,
        featured: false,
        hidden: true,
        manual: true,
        publishedAt: new Date(),
      },
    });

    return NextResponse.json({ article }, { status: 201 });
  } catch (error) {
    console.error("Email import error:", error);
    return NextResponse.json({ error: "Failed to import" }, { status: 500 });
  }
}
