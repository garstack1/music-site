import { prisma } from "@/lib/db";

const COUNTRY_MAP: Record<string, string> = {
  ireland: "IE", ie: "IE", ire: "IE", eire: "IE",
  "united kingdom": "GB", uk: "GB", gb: "GB", britain: "GB", "great britain": "GB",
  england: "GB", scotland: "GB", wales: "GB", "northern ireland": "GB",
  spain: "ES", es: "ES", espana: "ES",
  france: "FR", fr: "FR",
  germany: "DE", de: "DE", deutschland: "DE",
  netherlands: "NL", nl: "NL", holland: "NL",
  portugal: "PT", pt: "PT",
  belgium: "BE", be: "BE",
  italy: "IT", it: "IT",
  austria: "AT", at: "AT",
  switzerland: "CH", ch: "CH",
  denmark: "DK", dk: "DK",
  sweden: "SE", se: "SE",
  norway: "NO", no: "NO",
  finland: "FI", fi: "FI",
};

function normaliseCountry(raw: string): string | null {
  if (!raw) return null;
  const lower = raw.trim().toLowerCase();
  return COUNTRY_MAP[lower] || (lower.length === 2 ? lower.toUpperCase() : null);
}

function parseDate(raw: string): Date | null {
  if (!raw) return null;
  const trimmed = raw.trim();

  // YYYY-MM-DD
  const isoMatch = trimmed.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (isoMatch) {
    return new Date(parseInt(isoMatch[1]), parseInt(isoMatch[2]) - 1, parseInt(isoMatch[3]));
  }

  // DD-MM-YYYY or DD/MM/YYYY
  const dmy4 = trimmed.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4})$/);
  if (dmy4) {
    return new Date(parseInt(dmy4[3]), parseInt(dmy4[2]) - 1, parseInt(dmy4[1]));
  }

  // DD-MM-YY or DD/MM/YY
  const dmy2 = trimmed.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2})$/);
  if (dmy2) {
    const year = parseInt(dmy2[3]) + 2000;
    return new Date(year, parseInt(dmy2[2]) - 1, parseInt(dmy2[1]));
  }

  // Try native Date parse as fallback
  const fallback = new Date(trimmed);
  if (!isNaN(fallback.getTime())) return fallback;

  return null;
}

function parseTime(raw: string): string | null {
  if (!raw) return null;
  const trimmed = raw.trim().toLowerCase();

  // 20:00 or 20:00:00
  const mil = trimmed.match(/^(\d{1,2}):(\d{2})(:\d{2})?$/);
  if (mil) {
    return `${mil[1].padStart(2, "0")}:${mil[2]}:00`;
  }

  // 20.00
  const dot = trimmed.match(/^(\d{1,2})\.(\d{2})$/);
  if (dot) {
    return `${dot[1].padStart(2, "0")}:${dot[2]}:00`;
  }

  // 8pm, 8PM, 8 pm
  const pmSimple = trimmed.match(/^(\d{1,2})\s*(am|pm)$/i);
  if (pmSimple) {
    let hour = parseInt(pmSimple[1]);
    const isPm = pmSimple[2].toLowerCase() === "pm";
    if (isPm && hour < 12) hour += 12;
    if (!isPm && hour === 12) hour = 0;
    return `${String(hour).padStart(2, "0")}:00:00`;
  }

  // 8:30pm, 8:30 PM, 8.30pm
  const pmFull = trimmed.match(/^(\d{1,2})[:\.](\d{2})\s*(am|pm)$/i);
  if (pmFull) {
    let hour = parseInt(pmFull[1]);
    const isPm = pmFull[3].toLowerCase() === "pm";
    if (isPm && hour < 12) hour += 12;
    if (!isPm && hour === 12) hour = 0;
    return `${String(hour).padStart(2, "0")}:${pmFull[2]}:00`;
  }

  return null;
}

function parsePrice(raw: string): number | null {
  if (!raw) return null;
  const cleaned = raw.trim().replace(/[€£$]|EUR|GBP|USD/gi, "").trim();
  const num = parseFloat(cleaned);
  return isNaN(num) ? null : num;
}

function normaliseType(raw: string): "CONCERT" | "FESTIVAL" {
  if (!raw) return "CONCERT";
  const lower = raw.trim().toLowerCase();
  if (lower === "festival" || lower === "fest") return "FESTIVAL";
  return "CONCERT";
}

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80);
}

const PROFANITY_LIST = [
  "fuck", "shit", "cunt", "dick", "ass", "bitch", "bastard", "damn",
  "piss", "cock", "wanker", "bollocks", "twat", "slut", "whore",
];

function containsProfanity(text: string): boolean {
  if (!text) return false;
  const lower = text.toLowerCase();
  return PROFANITY_LIST.some((word) => {
    const regex = new RegExp(`\\b${word}\\b`, "i");
    return regex.test(lower);
  });
}

function isNonsense(text: string): boolean {
  if (!text) return false;
  if (text.length < 2) return true;
  // Check for random character strings
  const consonantRun = text.match(/[bcdfghjklmnpqrstvwxyz]{6,}/i);
  if (consonantRun) return true;
  // Check for repeated characters
  if (/(.)\1{4,}/.test(text)) return true;
  return false;
}

function validateRow(row: Record<string, string>): string | null {
  const name = row.event_name?.trim();
  if (!name) return "Missing event_name";
  if (isNonsense(name)) return `Nonsense event name: "${name}"`;
  if (containsProfanity(name)) return `Profanity in event name: "${name}"`;

  const country = normaliseCountry(row.country || "");
  if (!country) return `Invalid country: "${row.country}"`;

  const date = parseDate(row.date || "");
  if (!date) return `Invalid date: "${row.date}"`;
  if (date < new Date()) return `Past date: "${row.date}"`;

  if (row.artist && containsProfanity(row.artist)) return `Profanity in artist: "${row.artist}"`;
  if (row.description && containsProfanity(row.description)) return `Profanity in description`;
  if (row.venue && isNonsense(row.venue)) return `Nonsense venue: "${row.venue}"`;

  return null;
}

function parseCSV(text: string): Record<string, string>[] {
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  if (lines.length < 2) return [];

  const headers = parseCSVLine(lines[0]).map((h) => h.trim().toLowerCase());
  const rows: Record<string, string>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    const row: Record<string, string> = {};
    headers.forEach((h, j) => {
      row[h] = (values[j] || "").trim();
    });
    rows.push(row);
  }

  return rows;
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}

export interface CsvImportResult {
  sourceId: string;
  sourceName: string;
  total: number;
  imported: number;
  updated: number;
  skipped: number;
  rejected: string[];
  errors: string[];
}

export async function importCsvSource(sourceId: string): Promise<CsvImportResult> {
  const source = await prisma.csvSource.findUnique({ where: { id: sourceId } });

  if (!source) {
    return { sourceId, sourceName: "Unknown", total: 0, imported: 0, updated: 0, skipped: 0, rejected: [], errors: ["Source not found"] };
  }

  const result: CsvImportResult = {
    sourceId: source.id,
    sourceName: source.name,
    total: 0,
    imported: 0,
    updated: 0,
    skipped: 0,
    rejected: [],
    errors: [],
  };

  try {
    const res = await fetch(source.url, { redirect: "follow" });
    if (!res.ok) {
      result.errors.push(`Failed to fetch CSV: ${res.status}`);
      return result;
    }

    const text = await res.text();
    const rows = parseCSV(text);
    result.total = rows.length;

    for (const row of rows) {
      try {
        const validationError = validateRow(row);
        if (validationError) {
          result.rejected.push(validationError);
          continue;
        }

        const name = row.event_name.trim();
        const artist = row.artist?.trim() || null;
        const venue = row.venue?.trim() || null;
        const city = row.city?.trim() || null;
        const country = normaliseCountry(row.country)!;
        const date = parseDate(row.date)!;
        const endDate = parseDate(row.end_date || "");
        const startTime = parseTime(row.time || "");
        const type = normaliseType(row.type || "");
        const genre = row.genre?.trim() || null;
        const subGenre = row.sub_genre?.trim() || null;
        const ticketUrl = row.ticket_url?.trim() || null;
        const description = row.description?.trim() || null;
        const priceMin = parsePrice(row.price_min || "");
        const priceMax = parsePrice(row.price_max || "");
        const imageUrl = row.image_url?.trim() || null;
        const artistWebsite = row.artist_website?.trim() || null;
        const artistFacebook = row.artist_facebook?.trim() || null;
        const artistTwitter = row.artist_twitter?.trim() || null;
        const artistInstagram = row.artist_instagram?.trim() || null;
        const artistSpotify = row.artist_spotify?.trim() || null;
        const artistYoutube = row.artist_youtube?.trim() || null;
        const artistTiktok = row.artist_tiktok?.trim() || null;

        const dateStr = date.toISOString().split("T")[0];
        const fp = "csv-" + slugify([artist || name, venue, city, dateStr].filter(Boolean).join("-"));

        // Check for existing CSV event with same fingerprint
        const existingCsv = await prisma.event.findFirst({
          where: { fingerprint: fp },
        });

        // Check for cross-source duplicate (e.g. same event from Ticketmaster)
        // Match on similar artist + venue + same date
        const crossDuplicate = !existingCsv && artist && venue ? await prisma.event.findFirst({
          where: {
            source: { not: "CSV" },
            date: {
              gte: new Date(dateStr + "T00:00:00Z"),
              lt: new Date(dateStr + "T23:59:59Z"),
            },
            artist: { contains: artist, mode: "insensitive" },
            venue: { contains: venue, mode: "insensitive" },
          },
        }) : null;

        if (crossDuplicate) {
          // Ticketmaster data wins — skip CSV import but update any missing fields
          const updates: Record<string, unknown> = {};
          if (!crossDuplicate.genre && genre) updates.genre = genre;
          if (!crossDuplicate.subGenre && subGenre) updates.subGenre = subGenre;
          if (!crossDuplicate.description && description) updates.description = description;
          if (!crossDuplicate.priceMin && priceMin) updates.priceMin = priceMin;
          if (!crossDuplicate.priceMax && priceMax) updates.priceMax = priceMax;
          if (Object.keys(updates).length > 0) {
            await prisma.event.update({ where: { id: crossDuplicate.id }, data: updates });
          }
          result.skipped++;
          continue;
        }

        const eventData = {
          name,
          type: type as "CONCERT" | "FESTIVAL",
          artist,
          venue,
          city,
          country,
          date,
          endDate,
          startTime,
          genre,
          subGenre,
          ticketUrl,
          description,
          imageUrl,
          priceMin,
          priceMax,
          priceCurrency: country === "GB" ? "GBP" : "EUR",
          source: "CSV" as const,
          fingerprint: fp,
          active: true,
          artistWebsite,
          artistFacebook,
          artistTwitter,
          artistInstagram,
          artistSpotify,
          artistYoutube,
          artistTiktok,
        };

        if (existingCsv) {
          await prisma.event.update({
            where: { id: existingCsv.id },
            data: eventData,
          });
          result.updated++;
        } else {
          await prisma.event.create({ data: eventData });
          result.imported++;
        }
      } catch (e) {
        result.errors.push(e instanceof Error ? e.message : "Unknown error");
      }
    }

    await prisma.csvSource.update({
      where: { id: source.id },
      data: { lastPolled: new Date() },
    });
  } catch (e) {
    result.errors.push(e instanceof Error ? e.message : "Unknown error");
  }

  return result;
}

export async function importAllCsvSources(): Promise<CsvImportResult[]> {
  const sources = await prisma.csvSource.findMany({
    where: { active: true },
  });

  const results: CsvImportResult[] = [];
  for (const source of sources) {
    results.push(await importCsvSource(source.id));
  }
  return results;
}
