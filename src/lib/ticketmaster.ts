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

function getSocialLinks(event: TmEvent) {
  const links = event._embedded?.attractions?.[0]?.externalLinks;
  if (!links) return {
    artistWebsite: null,
    artistFacebook: null,
    artistTwitter: null,
    artistInstagram: null,
    artistSpotify: null,
    artistYoutube: null,
    artistTiktok: null,
  };
  return {
    artistWebsite: links.homepage?.[0]?.url || null,
    artistFacebook: links.facebook?.[0]?.url || null,
    artistTwitter: links.twitter?.[0]?.url || null,
    artistInstagram: links.instagram?.[0]?.url || null,
    artistSpotify: links.spotify?.[0]?.url || null,
    artistYoutube: links.youtube?.[0]?.url || null,
    artistTiktok: links.tiktok?.[0]?.url || null,
  };
}

function getDescription(event: TmEvent): string | null {
  if (event.info) return event.info;
  if (event.pleaseNote) return event.pleaseNote;
  return null;
}

async function fetchPage(countryCode: string, page: number = 0, segmentId: string = MUSIC_SEGMENT_ID): Promise<{ events: TmEvent[]; totalPages: number }> {
  if (!API_KEY) throw new Error("TICKETMASTER_API_KEY not set");

  const params = new URLSearchParams({
    apikey: API_KEY,
    countryCode,
    segmentId,
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
  concertNiOnly: boolean,
  segmentId: string = MUSIC_SEGMENT_ID
): Promise<ImportResult> {
  const isComedy = segmentId === COMEDY_SEGMENT_ID;
  const result: ImportResult = {
    country: countryCode,
    type: isComedy ? "Comedy" : (festivalOnly ? "Festivals" : "Concerts"),
    fetched: 0,
    imported: 0,
    updated: 0,
    skipped: 0,
    errors: [],
  };

  try {
    for (let page = 0; page < maxPages; page++) {
      const { events, totalPages } = await fetchPage(countryCode, page, segmentId);
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
          const socialLinks = getSocialLinks(tm);

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
            // Delete existing presales for this event first (to avoid duplicates on update)
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
              } catch (presaleError) {
                // Silently continue if presale creation fails
              }
            }
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

  // Ireland Music Concerts - 10 pages (up to 1000 events)
  results.push(await importEvents("IE", 10, false, false, MUSIC_SEGMENT_ID));
  
  // UK/NI Music Concerts - 5 pages (up to 500 events)
  results.push(await importEvents("GB", 5, false, true, MUSIC_SEGMENT_ID));

  // Ireland Comedy - 5 pages
  results.push(await importEvents("IE", 5, false, false, COMEDY_SEGMENT_ID));
  
  // UK/NI Comedy - 3 pages
  results.push(await importEvents("GB", 3, false, true, COMEDY_SEGMENT_ID));

  // European Music Festivals - 5 pages each country (up to 500 per country)
  for (const country of FESTIVAL_COUNTRIES) {
    results.push(await importEvents(country, 5, true, false, MUSIC_SEGMENT_ID));
    await new Promise((r) => setTimeout(r, 250));
  }

  return results;
}

// Search for events by keyword and import them with presales
export async function searchAndImportEvents(keyword: string, countryCode: string = "IE"): Promise<ImportResult> {
  if (!API_KEY) throw new Error("TICKETMASTER_API_KEY not set");
  
  const result: ImportResult = {
    country: countryCode,
    type: `Search: ${keyword}`,
    fetched: 0,
    imported: 0,
    updated: 0,
    skipped: 0,
    errors: [],
  };

  try {
    const params = new URLSearchParams({
      apikey: API_KEY,
      keyword,
      countryCode,
      segmentId: MUSIC_SEGMENT_ID,
      size: "50",
      sort: "date,asc",
      startDateTime: new Date().toISOString().split(".")[0] + "Z",
    });

    const res = await fetch(`${BASE_URL}/events.json?${params}`);
    if (!res.ok) throw new Error(`TM API error ${res.status}: ${await res.text()}`);

    const data = await res.json();
    const events: TmEvent[] = data._embedded?.events || [];
    result.fetched = events.length;

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

        const fp = fingerprint(artist, venueName, city, dateStr);
        const endDateStr = tm.dates?.end?.localDate;
        const startTime = tm.dates?.start?.localTime || null;
        const genre = getGenre(tm);
        const subGenre = getSubGenre(tm);
        const description = getDescription(tm);
        const priceRange = tm.priceRanges?.[0];
        const socialLinks = getSocialLinks(tm);

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
            } catch (presaleError) {
              // Silently continue
            }
          }
        }
      } catch (e) {
        result.errors.push(e instanceof Error ? e.message : "Unknown error");
      }
    }
  } catch (e) {
    result.errors.push(e instanceof Error ? e.message : "Unknown error");
  }

  return result;
}
