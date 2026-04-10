import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic();

export interface FestivalResult {
  name: string;
  startDate: string | null;
  endDate: string | null;
  venue: string | null;
  city: string | null;
  country: string | null;
  latitude: number | null;
  longitude: number | null;
  genre: string | null;
  description: string | null;
  ticketUrl: string | null;
  websiteUrl: string | null;
  imageUrl: string | null;
  lineup: string[];
  source: string;
}

// GET - List saved searches
export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const searches = await prisma.festivalSearch.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ searches });
  } catch (error) {
    console.error("Error fetching searches:", error);
    return NextResponse.json({ error: "Failed to fetch searches" }, { status: 500 });
  }
}

// POST - Perform a new search
export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { query, saveSearch, searchName } = body;

    if (!query || typeof query !== "string") {
      return NextResponse.json({ error: "Search query required" }, { status: 400 });
    }

    // Use Claude with web search to find festival information
    const festivals = await searchFestivals(query);

    // Optionally save the search
    if (saveSearch && searchName) {
      await prisma.festivalSearch.create({
        data: {
          name: searchName,
          searchQuery: query,
          lastSearched: new Date(),
          resultsCount: festivals.length,
        },
      });
    }

    return NextResponse.json({
      success: true,
      query,
      festivals,
      count: festivals.length,
    });
  } catch (error) {
    console.error("Festival search error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Search failed" },
      { status: 500 }
    );
  }
}

// DELETE - Remove a saved search
export async function DELETE(request: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Search ID required" }, { status: 400 });
    }

    await prisma.festivalSearch.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete search error:", error);
    return NextResponse.json({ error: "Failed to delete search" }, { status: 500 });
  }
}

async function searchFestivals(query: string): Promise<FestivalResult[]> {
  const systemPrompt = `You are a festival data extraction assistant. When given search results about music festivals, extract structured data for each festival found.

For each festival, extract:
- name: The festival name
- startDate: Start date in YYYY-MM-DD format (or null if unknown)
- endDate: End date in YYYY-MM-DD format (or null if unknown)
- venue: The venue name (e.g., "Stradbally Hall", "Marlay Park")
- city: The city (e.g., "Dublin", "Laois")
- country: The country code (e.g., "IE" for Ireland, "GB" for UK)
- latitude: Latitude if known (or null)
- longitude: Longitude if known (or null)
- genre: Primary genre (e.g., "Rock", "Electronic", "Multi-Genre")
- description: A brief description of the festival
- ticketUrl: URL to buy tickets (or null)
- websiteUrl: Official festival website (or null)
- imageUrl: Festival poster/image URL (or null)
- lineup: Array of artist names performing (empty array if unknown)
- source: The website where this information was found

Return ONLY a valid JSON array of festival objects. No markdown, no explanation, just the JSON array.
If no festivals are found, return an empty array: []`;

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 4096,
    tools: [
      {
        type: "web_search_20250305",
        name: "web_search",
      },
    ],
    messages: [
      {
        role: "user",
        content: `Search for music festivals matching: "${query}"

Find festivals and extract their details including dates, venue, location, genre, description, ticket links, and lineup information. Focus on upcoming festivals in 2025 and 2026.

After searching, return the results as a JSON array of festival objects.`,
      },
    ],
  });

  // Extract the text content from the response
  let textContent = "";
  for (const block of response.content) {
    if (block.type === "text") {
      textContent += block.text;
    }
  }

  // Parse the JSON response
  try {
    // Try to extract JSON from the response
    const jsonMatch = textContent.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      const festivals = JSON.parse(jsonMatch[0]) as FestivalResult[];
      return festivals;
    }
    return [];
  } catch (parseError) {
    console.error("Failed to parse festival data:", parseError);
    console.error("Raw response:", textContent);
    return [];
  }
}
