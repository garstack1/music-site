/**
 * Ticketmaster Import Script
 * 
 * This script runs directly via GitHub Actions (not through Vercel)
 * to avoid timeout issues. It connects directly to Supabase.
 * 
 * Usage: npx tsx scripts/import-events.ts
 * 
 * Schedule can be modified in .github/workflows/ticketmaster-direct.yml
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const API_KEY = process.env.TICKETMASTER_API_KEY;
const BASE_URL = "https://app.ticketmaster.com/discovery/v2";
const AFFILIATE_ID = process.env.TICKETMASTER_AFFILIATE_ID || "";

const NI_CITIES = [
  "belfast", "derry", "londonderry", "newry", "lisburn",
  "bangor", "armagh", "omagh", "enniskillen", "craigavon",
  "portadown", "lurgan", "ballymena", "carrickfergus",
  "newtownabbey", "coleraine", "antrim", "dungannon",
  "downpatrick", "strabane", "larne", "cookstown",
];

const FESTIVAL_COUNTRIES = [
  "IE", "GB", "ES", "FR", "DE", "NL", "PT", "BE", "IT", "AT", "CH", "DK", "SE", "NO", "FI",
  "PL", "CZ", "HU", "HR", "GR", "RO", "BG", "SK", "SI", "LT", "LV", "EE",
];

const MUSIC_SEGMENT_ID = "KZFzniwnSyZfZ7v7nJ";
const COMEDY_SEGMENT_ID = "KZFzniwnSyZfZ7v7na";

interface TmPresale {
  name: string;
  description?: string;
  url?: string;
  startDateTime: string;
  endDateTime: string;
}

interface TmEvent {
  id: string;
  name: string;
  url: string;
  info?: string;
  pleaseNote?: string;
  dates: {
    start: { localDate?: string; localTime?: string };
    end?: { localDate?: string };
  };
  sales?: {
    presales?: TmPresale[];
  };
  priceRanges?: {
    type: string;
    currency: string;
    min: number;
    max: number;
  }[];
  classifications?: {
    segment?: { id: string; name: string };
    genre?: { id: string; name: string };
    subGenre?: { id: string; name: string };
  }[];
  _embedded?: {
    venues?: {
      name: string;
      city?: { name: string };
      country?: { countryCode: string };
      location?: { longitude: string; latitude: string };
    }[];
    attractions?: {
      name: string;
      externalLinks?: {
        facebook?: { url: string }[];
        twitter?: { url: string }[];
        instagram?: { url: string }[];
        spotify?: { url: string }[];
        youtube?: { url: string }[];
        tiktok?: { url: string }[];
        homepage?: { url: string }[];
      };
    }[];
  };
  images?: { url: string; width: number; height: number; ratio?: string }[];
}

interface ImportResult {
  source: string;
  imported: number;
  updated: number;
  skipped: number;
  errors: string[];
}

function getAffiliateUrl(url: string): string {
  if (!AFFILIATE_ID) return url;
  const sep = url.includes("?") ? "&" : "?";
  return `${url}${sep}aid=${AFFILIATE_ID}`;
}

function isNorthernIreland(city?: string, country?: string): boolean {
  if (country !== "GB") return false;
  if (!city) return false;
  return NI_CITIES.includes(city.toLowerCase());
}

function generateFingerprint(event: TmEvent): string {
  const venue = event._embedded?.venues?.[0];
  const date = event.dates.start.localDate || "";
  const venueName = venue?.name || "";
  return `${event.name.toLowerCase().trim()}|${date}|${venueName.toLowerCase().trim()}`;
}

function getBestImage(images?: TmEvent["images"]): string | null {
  if (!images || images.length === 0) return null;
  const ratio16x9 = images.filter((img) => img.ratio === "16_9");
  const sorted = (ratio16x9.length > 0 ? ratio16x9 : images).sort(
    (a, b) => b.width - a.width
  );
  return sorted[0]?.url || null;
}

async function importEvents(
  countryCode: string,
  maxPages: number = 5,
  festivalsOnly: boolean = false,
  niOnly: boolean = false,
  segmentId: string = MUSIC_SEGMENT_ID
): Promise<ImportResult> {
  const result: ImportResult = {
    source: `${countryCode}${festivalsOnly ? " Festivals" : ""}${niOnly ? " (NI)" : ""} - ${segmentId === COMEDY_SEGMENT_ID ? "Comedy" : "Music"}`,
    imported: 0,
    updated: 0,
    skipped: 0,
    errors: [],
  };

  if (!API_KEY) {
    result.errors.push("TICKETMASTER_API_KEY not set");
    return result;
  }

  try {
    for (let page = 0; page < maxPages; page++) {
      const params = new URLSearchParams({
        apikey: API_KEY,
        countryCode,
        size: "100",
        page: page.toString(),
        sort: "date,asc",
        segmentId,
      });

      if (festivalsOnly) {
        params.set("keyword", "festival");
      }

      const url = `${BASE_URL}/events.json?${params}`;
      const res = await fetch(url);

      if (!res.ok) {
        if (res.status === 429) {
          console.log(`Rate limited on page ${page}, waiting 2s...`);
          await new Promise((r) => setTimeout(r, 2000));
          page--;
          continue;
        }
        result.errors.push(`API error ${res.status} on page ${page}`);
        continue;
      }

      const data = await res.json();
      const events: TmEvent[] = data._embedded?.events || [];

      if (events.length === 0) break;

      for (const tm of events) {
        try {
          const venue = tm._embedded?.venues?.[0];

          if (niOnly && !isNorthernIreland(venue?.city?.name, venue?.country?.countryCode)) {
            result.skipped++;
            continue;
          }

          if (!niOnly && countryCode === "GB" && isNorthernIreland(venue?.city?.name, venue?.country?.countryCode)) {
            // Skip NI events when doing GB import (they're handled separately)
          }

          const fp = generateFingerprint(tm);
          const existing = await prisma.event.findFirst({
            where: { fingerprint: fp },
          });

          const classification = tm.classifications?.[0];
          const genre = classification?.genre?.name || null;
          const subGenre = classification?.subGenre?.name || null;

          const dateStr = tm.dates.start.localDate;
          const timeStr = tm.dates.start.localTime;
          let startTime: Date | null = null;
          if (dateStr) {
            startTime = timeStr
              ? new Date(`${dateStr}T${timeStr}`)
              : new Date(`${dateStr}T00:00:00`);
          }

          const priceRange = tm.priceRanges?.find((p) => p.type === "standard") || tm.priceRanges?.[0];

          const attraction = tm._embedded?.attractions?.[0];
          const socialLinks: Record<string, string | null> = {
            artistWebsite: attraction?.externalLinks?.homepage?.[0]?.url || null,
            artistFacebook: attraction?.externalLinks?.facebook?.[0]?.url || null,
            artistTwitter: attraction?.externalLinks?.twitter?.[0]?.url || null,
            artistInstagram: attraction?.externalLinks?.instagram?.[0]?.url || null,
            artistSpotify: attraction?.externalLinks?.spotify?.[0]?.url || null,
            artistYoutube: attraction?.externalLinks?.youtube?.[0]?.url || null,
            artistTiktok: attraction?.externalLinks?.tiktok?.[0]?.url || null,
          };

          const eventData = {
            name: tm.name,
            slug: tm.name
              .toLowerCase()
              .replace(/[^a-z0-9]+/g, "-")
              .replace(/^-+|-+$/g, "")
              .slice(0, 100) + "-" + tm.id.slice(-6),
            description: [tm.info, tm.pleaseNote].filter(Boolean).join("\n\n") || null,
            date: dateStr ? new Date(dateStr) : new Date(),
            endDate: tm.dates.end?.localDate ? new Date(tm.dates.end.localDate) : null,
            venue: venue?.name || "TBA",
            city: venue?.city?.name || null,
            country: venue?.country?.countryCode || countryCode,
            ticketUrl: getAffiliateUrl(tm.url),
            imageUrl: getBestImage(tm.images),
            isFestival: festivalsOnly || tm.name.toLowerCase().includes("festival"),
            genre,
            subGenre,
            startTime,
            priceMin: priceRange?.min || null,
            priceMax: priceRange?.max || null,
            priceCurrency: priceRange?.currency || null,
            source: "TICKETMASTER" as const,
            sourceId: tm.id,
            fingerprint: fp,
            latitude: venue?.location?.latitude ? parseFloat(venue.location.latitude) : null,
            longitude: venue?.location?.longitude ? parseFloat(venue.location.longitude) : null,
            active: true,
            ...socialLinks,
          };

          let eventId: string;

          if (existing) {
            await prisma.event.update({
              where: { id: existing.id },
              data: {
                name: eventData.name,
                ticketUrl: eventData.ticketUrl,
                imageUrl: eventData.imageUrl || undefined,
                genre: eventData.genre || undefined,
                subGenre: eventData.subGenre || undefined,
                startTime: eventData.startTime || undefined,
                description: eventData.description || undefined,
                priceMin: eventData.priceMin,
                priceMax: eventData.priceMax,
                priceCurrency: eventData.priceCurrency,
                latitude: eventData.latitude,
                longitude: eventData.longitude,
                artistWebsite: eventData.artistWebsite || undefined,
                artistFacebook: eventData.artistFacebook || undefined,
                artistTwitter: eventData.artistTwitter || undefined,
                artistInstagram: eventData.artistInstagram || undefined,
                artistSpotify: eventData.artistSpotify || undefined,
                artistYoutube: eventData.artistYoutube || undefined,
                artistTiktok: eventData.artistTiktok || undefined,
              },
            });
            eventId = existing.id;
            result.updated++;
          } else {
            const newEvent = await prisma.event.create({ data: eventData });
            eventId = newEvent.id;
            result.imported++;
          }

          // Import presales if available
          if (tm.sales?.presales && tm.sales.presales.length > 0) {
            await prisma.presale.deleteMany({ where: { eventId } });

            for (const presale of tm.sales.presales) {
              try {
                await prisma.presale.create({
                  data: {
                    eventId,
                    name: presale.name,
                    description: presale.description || null,
                    url: presale.url || null,
                    startDateTime: new Date(presale.startDateTime),
                    endDateTime: new Date(presale.endDateTime),
                  },
                });
              } catch {
                // Silently continue
              }
            }
          }
        } catch (e) {
          result.errors.push(e instanceof Error ? e.message : "Unknown error");
        }
      }

      // Rate limit protection
      await new Promise((r) => setTimeout(r, 250));
    }
  } catch (e) {
    result.errors.push(e instanceof Error ? e.message : "Unknown error");
  }

  return result;
}

async function importAllEvents(): Promise<ImportResult[]> {
  const results: ImportResult[] = [];

  console.log("🎵 Starting Ticketmaster import...\n");

  // Ireland Music Concerts - 10 pages (up to 1000 events)
  console.log("📍 Importing Ireland Music Concerts...");
  results.push(await importEvents("IE", 10, false, false, MUSIC_SEGMENT_ID));
  console.log(`   ✓ ${results[results.length - 1].imported} new, ${results[results.length - 1].updated} updated\n`);

  // UK/NI Music Concerts - 5 pages (up to 500 events)
  console.log("📍 Importing UK/NI Music Concerts...");
  results.push(await importEvents("GB", 5, false, true, MUSIC_SEGMENT_ID));
  console.log(`   ✓ ${results[results.length - 1].imported} new, ${results[results.length - 1].updated} updated\n`);

  // Ireland Comedy - 5 pages
  console.log("📍 Importing Ireland Comedy...");
  results.push(await importEvents("IE", 5, false, false, COMEDY_SEGMENT_ID));
  console.log(`   ✓ ${results[results.length - 1].imported} new, ${results[results.length - 1].updated} updated\n`);

  // UK/NI Comedy - 3 pages
  console.log("📍 Importing UK/NI Comedy...");
  results.push(await importEvents("GB", 3, false, true, COMEDY_SEGMENT_ID));
  console.log(`   ✓ ${results[results.length - 1].imported} new, ${results[results.length - 1].updated} updated\n`);

  // European Music Festivals - 5 pages each country
  console.log("📍 Importing European Festivals...");
  for (const country of FESTIVAL_COUNTRIES) {
    process.stdout.write(`   ${country}...`);
    const result = await importEvents(country, 5, true, false, MUSIC_SEGMENT_ID);
    results.push(result);
    console.log(` ${result.imported} new, ${result.updated} updated`);
    await new Promise((r) => setTimeout(r, 250));
  }

  return results;
}

async function main() {
  console.log("=".repeat(50));
  console.log("🎫 TICKETMASTER EVENT IMPORT");
  console.log(`📅 ${new Date().toISOString()}`);
  console.log("=".repeat(50) + "\n");

  try {
    const results = await importAllEvents();

    // Summary
    const totals = results.reduce(
      (acc, r) => ({
        imported: acc.imported + r.imported,
        updated: acc.updated + r.updated,
        skipped: acc.skipped + r.skipped,
        errors: acc.errors + r.errors.length,
      }),
      { imported: 0, updated: 0, skipped: 0, errors: 0 }
    );

    console.log("\n" + "=".repeat(50));
    console.log("📊 SUMMARY");
    console.log("=".repeat(50));
    console.log(`✅ Imported: ${totals.imported}`);
    console.log(`🔄 Updated:  ${totals.updated}`);
    console.log(`⏭️  Skipped:  ${totals.skipped}`);
    console.log(`❌ Errors:   ${totals.errors}`);
    console.log("=".repeat(50));

    if (totals.errors > 0) {
      console.log("\n⚠️  Errors encountered:");
      for (const r of results) {
        for (const err of r.errors) {
          console.log(`   - [${r.source}] ${err}`);
        }
      }
    }

    console.log("\n✅ Import complete!");
  } catch (error) {
    console.error("❌ Fatal error:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
