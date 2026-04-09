import RSSParser from "rss-parser";
import { prisma } from "@/lib/db";

const parser = new RSSParser({
  timeout: 10000,
  headers: {
    "User-Agent": "MusicSite RSS Poller/1.0",
  },
});

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 100);
}

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, "")
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
    .replace(/&#([0-9]+);/g, (_, dec) => String.fromCharCode(parseInt(dec, 10)))
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&rsquo;/g, "\u2019")
    .replace(/&lsquo;/g, "\u2018")
    .replace(/&rdquo;/g, "\u201C")
    .replace(/&ldquo;/g, "\u201D")
    .replace(/&mdash;/g, "\u2014")
    .replace(/&ndash;/g, "\u2013")
    .replace(/&hellip;/g, "\u2026")
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

interface PageMeta {
  ogImage: string | null;
  ogDescription: string | null;
}

async function fetchPageMeta(url: string): Promise<PageMeta> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const res = await fetch(url, {
      headers: { "User-Agent": "MusicSite RSS Poller/1.0" },
      signal: controller.signal,
      redirect: "follow",
    });

    clearTimeout(timeout);

    if (!res.ok) return { ogImage: null, ogDescription: null };

    const html = await res.text();

    const ogImageMatch = html.match(
      /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i
    ) || html.match(
      /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i
    );

    const twitterImageMatch = html.match(
      /<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i
    ) || html.match(
      /<meta[^>]+content=["']([^"']+)["'][^>]+name=["']twitter:image["']/i
    );

    const ogDescMatch = html.match(
      /<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["']/i
    ) || html.match(
      /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:description["']/i
    );

    const metaDescMatch = html.match(
      /<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i
    ) || html.match(
      /<meta[^>]+content=["']([^"']+)["'][^>]+name=["']description["']/i
    );

    return {
      ogImage: ogImageMatch?.[1] || twitterImageMatch?.[1] || null,
      ogDescription: ogDescMatch?.[1] || metaDescMatch?.[1] || null,
    };
  } catch {
    return { ogImage: null, ogDescription: null };
  }
}

function extractImageFromContent(item: RSSParser.Item): string | null {
  if (item.enclosure?.url && item.enclosure.type?.startsWith("image")) {
    return item.enclosure.url;
  }

  const mediaContent = (item as Record<string, unknown>)["media:content"] as
    | { $?: { url?: string } }
    | undefined;
  if (mediaContent?.$?.url) {
    return mediaContent.$.url;
  }

  const mediaThumbnail = (item as Record<string, unknown>)[
    "media:thumbnail"
  ] as { $?: { url?: string } } | undefined;
  if (mediaThumbnail?.$?.url) {
    return mediaThumbnail.$.url;
  }

  const encoded = (item as Record<string, unknown>)["content:encoded"] as string | undefined;
  const content = encoded || item.content || "";
  const imgMatch = content.match(/<img[^>]+src=["']([^"']+)["']/);
  if (imgMatch) {
    return imgMatch[1];
  }

  return null;
}

function getBestSummary(item: RSSParser.Item, pageMeta: PageMeta): string | null {
  const candidates: string[] = [];

  const encoded = (item as Record<string, unknown>)["content:encoded"] as string | undefined;
  if (encoded) {
    candidates.push(stripHtml(encoded));
  }

  if (item.content) {
    candidates.push(stripHtml(item.content));
  }

  if (item.contentSnippet) {
    candidates.push(item.contentSnippet.trim());
  }

  if (pageMeta.ogDescription) {
    candidates.push(stripHtml(pageMeta.ogDescription));
  }

  // Pick the longest one that's at least 50 chars
  const best = candidates
    .filter((c) => c.length > 0)
    .sort((a, b) => b.length - a.length)[0];

  if (!best) return null;

  // Trim to roughly 80 words
  const words = best.split(/\s+/);
  if (words.length > 80) {
    return words.slice(0, 80).join(" ") + "...";
  }

  return best;
}

export interface PollResult {
  feedId: string;
  feedName: string;
  newArticles: number;
  skipped: number;
  errors: string[];
}

export async function pollFeed(feedId: string): Promise<PollResult> {
  const feed = await prisma.rssFeed.findUnique({ where: { id: feedId } });

  if (!feed) {
    return { feedId, feedName: "Unknown", newArticles: 0, skipped: 0, errors: ["Feed not found"] };
  }

  const result: PollResult = {
    feedId: feed.id,
    feedName: feed.name,
    newArticles: 0,
    skipped: 0,
    errors: [],
  };

  try {
    const parsed = await parser.parseURL(feed.url);
    const items = parsed.items || [];

    for (const item of items) {
      try {
        const sourceUrl = item.link;
        if (!sourceUrl) {
          result.skipped++;
          continue;
        }

        const existing = await prisma.newsArticle.findUnique({
          where: { sourceUrl },
        });

        if (existing) {
          result.skipped++;
          continue;
        }

        const title = item.title?.trim();
        if (!title) {
          result.skipped++;
          continue;
        }

        let slug = slugify(title);
        const existingSlug = await prisma.newsArticle.findUnique({
          where: { slug },
        });
        if (existingSlug) {
          slug = `${slug}-${Date.now().toString(36)}`;
        }

        let imageUrl = extractImageFromContent(item);
        let pageMeta: PageMeta = { ogImage: null, ogDescription: null };

        // Fetch page meta if we need image or better summary
        if (!imageUrl || !item.contentSnippet || item.contentSnippet.split(/\s+/).length < 25) {
          pageMeta = await fetchPageMeta(sourceUrl);
        }

        if (!imageUrl) {
          imageUrl = pageMeta.ogImage;
        }

        const summary = getBestSummary(item, pageMeta);
        const publishedAt = item.pubDate ? new Date(item.pubDate) : new Date();

        await prisma.newsArticle.create({
          data: {
            title,
            slug,
            summary,
            sourceUrl,
            imageUrl,
            featured: false,
            hidden: false,
            manual: false,
            sourceLabel: `via ${feed.name}`,  // Custom source label from RSS feed name
            publishedAt,
            rssFeedId: feed.id,
          },
        });

        result.newArticles++;
      } catch (itemError) {
        const msg = itemError instanceof Error ? itemError.message : "Unknown error";
        result.errors.push(`Item error: ${msg}`);
      }
    }

    await prisma.rssFeed.update({
      where: { id: feed.id },
      data: { lastPolled: new Date() },
    });
  } catch (feedError) {
    const msg = feedError instanceof Error ? feedError.message : "Unknown error";
    result.errors.push(`Feed error: ${msg}`);
  }

  return result;
}

export async function pollAllFeeds(): Promise<PollResult[]> {
  const feeds = await prisma.rssFeed.findMany({
    where: { active: true },
  });

  const results: PollResult[] = [];

  for (const feed of feeds) {
    const result = await pollFeed(feed.id);
    results.push(result);
  }

  return results;
}
