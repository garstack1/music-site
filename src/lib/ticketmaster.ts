import { prisma } from "@/lib/db";

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
];

const MUSIC_SEGMENT_ID = "KZFzniwnSyZfZ7v7nJ";

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
    attractions?: { name: string }[];
  };
  images?: { url: string; width: number; height: number; ratio?: string }[];
}

function getAffiliateUrl(url: string): string {
  if (!AFFILIATE_ID) return url;
  const sep = url.includes("?") ? "&" : "?";
  return `${url}${sep}aid=${AFFILIATE_ID}`;
}

function getBestImage(images?: TmEvent["images"]): string | null {
  if (!images || images.length === 0) return null;
  const preferred = images.find((i) => i.ratio === "16_9" && i.width >= 640);
  return preferred?.url || images[0]?.url || null;
}

function fingerprint(artist: string | null, venue: string | null, city: string | null, date: string): string {
  return "tm-" + [artist, venue, city, date].filter(Boolean).join("-").toLowerCase().replace(/[^a-z0-9]+/g, "-");
}

function isFestival(event: TmEvent): boolean {
  const name = event.name.toLowerCase();
  if (["festival", "fest", "weekender", "open air"].some((kw) => name.includes(kw))) return true;
  for (const c of event.classifications || []) {
    if (c.genre?.name?.toLowerCase().includes("festival")) return true;
    if (c.subGenre?.name?.toLowerCase().includes("festival")) return true;
  }
  return false;
}

function getGenre(event: TmEvent): string | null {
  for (const c of event.classifications || []) {
    if (c.genre?.name && c.genre.name !== "Undefined" && c.genre.name !== "Other") {
      return c.genre.name;
    }
  }
  return null;
}

function getSubGenre(event: TmEvent): string | null {
  for (const c of event.classifications || []) {
    if (c.subGenre?.name && c.subGenre.name !== "Undefined" && c.subGenre.name !== "Other") {
      return c.subGenre.name;
    }
  }
  return null;
}

function getDescription(event: TmEvent): string | null {
  if (event.info) return event.info;
  if (event.pleaseNote) return event.pleaseNote;
  return null;
}

async function fetchPage(countryCode: string, page: number = 0): Promise<{ events: TmEvent[]; totalPages: number }> {
  if (!API_KEY) throw new Error("TICKETMASTER_API_KEY not set");

  const params = new URLSearchParams({
    apikey: API_KEY,
    countryCode,
    segmentId: MUSIC_SEGMENT_ID,
    size: "100",
    page: page.toString(),
    sort: "date,asc",
    startDateTime: new Date().toISOString().split(".")[0] + "Z",
  });

  const res = await fetch(`${BASE_URL}/events.json?${params}`);
  if (!res.ok) throw new Error(`TM API error ${res.status}: ${await res.text()}`);

  const data = await res.json();
  return {
    events: data._embedded?.events || [],
    totalPages: data.page?.totalPages || 0,
  };
}

export interface ImportResult {
  country: string;
  type: string;
  fetched: number;
  imported: number;
  updated: number;
  skipped: number;
  errors: string[];
}

async function importEvents(
  countryCode: string,
  maxPages: number,
  festivalOnly: boolean,
  concertNiOnly: boolean
): Promise<ImportResult> {
  const result: ImportResult = {
    country: countryCode,
    type: festivalOnly ? "Festivals" : "Concerts",
    fetched: 0,
    imported: 0,
    updated: 0,
    skipped: 0,
    errors: [],
  };

  try {
    for (let page = 0; page < maxPages; page++) {
      const { events, totalPages } = await fetchPage(countryCode, page);
      result.fetched += events.length;

      for (const tm of events) {
        try {
          const dateStr = tm.dates?.start?.localDate;
          if (!dateStr) { result.skipped++; continue; }

          const date = new Date(dateStr);
          if (date < new Date()) { result.skipped++; continue; }

          const venue = tm._embedded?.venues?.[0];
          const artist = tm._embedded?.attractions?.[0]?.name || null;
          const venueName = venue?.name || null;
          const city = venue?.city?.name || null;
          const country = venue?.country?.countryCode || countryCode;
          const eventIsFestival = isFestival(tm);

          if (festivalOnly && !eventIsFestival) { result.skipped++; continue; }
          if (!festivalOnly && eventIsFestival) { result.skipped++; continue; }

          if (concertNiOnly && city) {
            if (!NI_CITIES.includes(city.toLowerCase())) {
              result.skipped++;
              continue;
            }
          }

          const fp = fingerprint(artist, venueName, city, dateStr);
          const endDateStr = tm.dates?.end?.localDate;
          const startTime = tm.dates?.start?.localTime || null;
          const genre = getGenre(tm);
          const subGenre = getSubGenre(tm);
          const description = getDescription(tm);
          const priceRange = tm.priceRanges?.[0];

          const existing = await prisma.event.findFirst({
            where: {
              OR: [{ fingerprint: fp }, { sourceId: tm.id }],
            },
          });

          const eventData = {
            name: tm.name,
            type: eventIsFestival ? "FESTIVAL" as const : "CONCERT" as const,
            artist,
            venue: venueName,
            city,
            country,
            date,
            endDate: endDateStr ? new Date(endDateStr) : null,
            ticketUrl: getAffiliateUrl(tm.url),
            description,
            imageUrl: getBestImage(tm.images),
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
          };

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
              },
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

      if (page >= totalPages - 1) break;
      await new Promise((r) => setTimeout(r, 250));
    }
  } catch (e) {
    result.errors.push(e instanceof Error ? e.message : "Unknown error");
  }

  return result;
}

export async function importAllEvents(): Promise<ImportResult[]> {
  const results: ImportResult[] = [];

  results.push(await importEvents("IE", 3, false, false));
  results.push(await importEvents("GB", 3, false, true));

  for (const country of FESTIVAL_COUNTRIES) {
    results.push(await importEvents(country, 2, true, false));
    await new Promise((r) => setTimeout(r, 250));
  }

  return results;
}
