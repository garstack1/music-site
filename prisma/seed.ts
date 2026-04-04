import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";

dotenv.config();

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Seeding database...");
  console.log("DB URL:", process.env.DATABASE_URL ? "SET" : "NOT SET");

  // GENRES
  const genres = [
    "Rock", "Indie", "Electronic", "Hip Hop", "Pop",
    "Metal", "Folk", "Jazz", "Classical", "R&B",
    "Punk", "Country", "Blues", "Reggae", "Soul",
    "Dance", "Alternative", "World Music"
  ];

  for (const name of genres) {
    await prisma.genre.upsert({
      where: { slug: name.toLowerCase().replace(/[&\s]+/g, "-") },
      update: {},
      create: {
        name,
        slug: name.toLowerCase().replace(/[&\s]+/g, "-"),
      },
    });
  }
  console.log(`Created ${genres.length} genres`);

  // ADMIN USER
  const adminPassword = await bcrypt.hash("admin123", 10);
  const admin = await prisma.user.upsert({
    where: { email: "garstack@gmail.com" },
    update: {},
    create: {
      email: "garstack@gmail.com",
      name: "Garrett Stack",
      passwordHash: adminPassword,
      role: "ADMIN",
    },
  });
  console.log(`Created admin user: ${admin.email}`);

  // RSS FEEDS
  const feeds = [
    { name: "Pitchfork", url: "https://pitchfork.com/feed/feed-news/rss" },
    { name: "NME", url: "https://www.nme.com/news/music/feed" },
    { name: "RTE Entertainment", url: "https://www.rte.ie/feeds/rss/?index=/entertainment/" },
  ];

  for (const feed of feeds) {
    await prisma.rssFeed.upsert({
      where: { url: feed.url },
      update: {},
      create: feed,
    });
  }
  console.log(`Created ${feeds.length} RSS feeds`);

  // SAMPLE NEWS
  const rockGenre = await prisma.genre.findUnique({ where: { slug: "rock" } });
  const indieGenre = await prisma.genre.findUnique({ where: { slug: "indie" } });
  const electronicGenre = await prisma.genre.findUnique({ where: { slug: "electronic" } });

  const articles = [
    {
      title: "Fontaines D.C. Announce New World Tour Dates",
      slug: "fontaines-dc-announce-new-world-tour-dates",
      summary: "The Dublin post-punk band have confirmed a massive world tour.",
      sourceUrl: "https://example.com/fontaines-dc-tour",
      imageUrl: "https://picsum.photos/seed/fontaines/800/400",
      featured: true,
      manual: true,
      publishedAt: new Date("2026-03-28"),
      genreId: rockGenre?.id,
    },
    {
      title: "Electric Picnic 2026 Lineup Revealed",
      slug: "electric-picnic-2026-lineup-revealed",
      summary: "Ireland's biggest music festival has dropped its full lineup for 2026.",
      sourceUrl: "https://example.com/ep-2026-lineup",
      imageUrl: "https://picsum.photos/seed/ep2026/800/400",
      featured: true,
      manual: true,
      publishedAt: new Date("2026-03-25"),
      genreId: indieGenre?.id,
    },
    {
      title: "New Electronic Festival Announced for Cork",
      slug: "new-electronic-festival-cork",
      summary: "A brand new three-day electronic music festival is set for Cork this summer.",
      sourceUrl: "https://example.com/cork-electronic-fest",
      imageUrl: "https://picsum.photos/seed/corkfest/800/400",
      featured: false,
      manual: true,
      publishedAt: new Date("2026-03-20"),
      genreId: electronicGenre?.id,
    },
    {
      title: "The Murder Capital Release Surprise EP",
      slug: "murder-capital-surprise-ep",
      summary: "Dublin five-piece have dropped an unexpected EP with four new tracks.",
      sourceUrl: "https://example.com/murder-capital-ep",
      imageUrl: "https://picsum.photos/seed/murdercap/800/400",
      featured: false,
      manual: true,
      publishedAt: new Date("2026-03-18"),
    },
    {
      title: "Sinead O'Brien Wins Choice Music Prize",
      slug: "sinead-obrien-choice-music-prize",
      summary: "The Limerick artist wins the prestigious Choice Music Prize.",
      sourceUrl: "https://example.com/sinead-obrien-choice",
      imageUrl: "https://picsum.photos/seed/sinead/800/400",
      featured: false,
      manual: true,
      publishedAt: new Date("2026-03-15"),
    },
  ];

  for (const article of articles) {
    const { genreId, ...articleData } = article;
    const created = await prisma.newsArticle.upsert({
      where: { sourceUrl: article.sourceUrl },
      update: {},
      create: articleData,
    });
    if (genreId) {
      await prisma.articleTag.upsert({
        where: { articleId_genreId: { articleId: created.id, genreId } },
        update: {},
        create: { articleId: created.id, genreId },
      });
    }
  }
  console.log(`Created ${articles.length} sample news articles`);

  // SAMPLE EVENTS
  const events = [
    {
      name: "Fontaines D.C.", type: "CONCERT" as const, artist: "Fontaines D.C.",
      venue: "3Arena", city: "Dublin", country: "Ireland",
      date: new Date("2026-06-15"), ticketUrl: "https://www.ticketmaster.ie",
      genre: "Rock", source: "MANUAL" as const,
      fingerprint: "fontainesdc|3arena|dublin|2026-06-15",
      latitude: 53.3478, longitude: -6.2297,
    },
    {
      name: "Arctic Monkeys", type: "CONCERT" as const, artist: "Arctic Monkeys",
      venue: "Marlay Park", city: "Dublin", country: "Ireland",
      date: new Date("2026-07-04"), ticketUrl: "https://www.ticketmaster.ie",
      genre: "Indie", source: "MANUAL" as const,
      fingerprint: "arcticmonkeys|marlaypark|dublin|2026-07-04",
      latitude: 53.2734, longitude: -6.2706,
    },
    {
      name: "Lankum", type: "CONCERT" as const, artist: "Lankum",
      venue: "Live at the Marquee", city: "Cork", country: "Ireland",
      date: new Date("2026-06-28"), ticketUrl: "https://www.ticketmaster.ie",
      genre: "Folk", source: "MANUAL" as const,
      fingerprint: "lankum|liveatthemarquee|cork|2026-06-28",
      latitude: 51.8969, longitude: -8.4636,
    },
    {
      name: "Electric Picnic 2026", type: "FESTIVAL" as const,
      venue: "Stradbally Estate", city: "Stradbally", country: "Ireland",
      date: new Date("2026-08-28"), endDate: new Date("2026-08-30"),
      ticketUrl: "https://www.electricpicnic.ie",
      description: "Ireland's premier music and arts festival.",
      genre: "Alternative", source: "MANUAL" as const,
      fingerprint: "electricpicnic2026|stradballyestate|stradbally|2026-08-28",
      latitude: 52.9547, longitude: -7.3214,
    },
    {
      name: "Primavera Sound 2026", type: "FESTIVAL" as const,
      venue: "Parc del Forum", city: "Barcelona", country: "Spain",
      date: new Date("2026-06-04"), endDate: new Date("2026-06-06"),
      ticketUrl: "https://www.primaverasound.com",
      description: "One of Europe's biggest music festivals.",
      genre: "Alternative", source: "MANUAL" as const,
      fingerprint: "primaverasound2026|parcdelforum|barcelona|2026-06-04",
      latitude: 41.4106, longitude: 2.2200,
    },
    {
      name: "Glastonbury 2026", type: "FESTIVAL" as const,
      venue: "Worthy Farm", city: "Pilton", country: "United Kingdom",
      date: new Date("2026-06-24"), endDate: new Date("2026-06-28"),
      ticketUrl: "https://www.glastonburyfestivals.co.uk",
      description: "The world's most famous music festival.",
      genre: "Rock", source: "MANUAL" as const,
      fingerprint: "glastonbury2026|worthyfarm|pilton|2026-06-24",
      latitude: 51.1537, longitude: -2.5858,
    },
    {
      name: "The Prodigy", type: "CONCERT" as const, artist: "The Prodigy",
      venue: "SSE Arena", city: "Belfast", country: "United Kingdom",
      date: new Date("2026-05-20"), ticketUrl: "https://www.ticketmaster.co.uk",
      genre: "Electronic", source: "MANUAL" as const,
      fingerprint: "theprodigy|ssearena|belfast|2026-05-20",
      latitude: 54.6049, longitude: -5.9198,
    },
  ];

  for (const event of events) {
    await prisma.event.upsert({
      where: { fingerprint: event.fingerprint },
      update: {},
      create: event,
    });
  }
  console.log(`Created ${events.length} sample events`);

  // SAMPLE REVIEWS
  const reviews = [
    {
      title: "Fontaines D.C. Bring the House Down at Vicar Street",
      slug: "fontaines-dc-vicar-street-march-2026",
      artist: "Fontaines D.C.", venue: "Vicar Street", city: "Dublin",
      eventDate: new Date("2026-03-10"),
      setlist: "In ar gCroithe go deo, Big Shot, Favourite, Starburster, Romance",
      body: "What a night. Fontaines D.C. returned to Vicar Street with the kind of intensity that reminds you why live music matters.\n\nGrian Chatten prowled the stage like a man possessed. The band were impossibly tight.\n\nThe setlist drew heavily from Romance but the older tracks hit hardest.\n\nThis is a band operating at the peak of their powers.",
      status: "PUBLISHED" as const,
      publishedAt: new Date("2026-03-12"),
    },
    {
      title: "Lankum's Transcendent Night at the National Concert Hall",
      slug: "lankum-national-concert-hall-feb-2026",
      artist: "Lankum", venue: "National Concert Hall", city: "Dublin",
      eventDate: new Date("2026-02-22"),
      setlist: "Go Dig My Grave, Netta Pradesh, The Granite Gaze, Bear Creek",
      body: "There's something almost spiritual about seeing Lankum in the National Concert Hall.\n\nThey opened with Go Dig My Grave and the room fell utterly silent.\n\nThe Granite Gaze was the standout — building from a whisper to an overwhelming crescendo.\n\nLankum have transcended genre at this point.",
      status: "PUBLISHED" as const,
      publishedAt: new Date("2026-02-25"),
    },
    {
      title: "The Murder Capital at Whelan's — Raw and Relentless",
      slug: "murder-capital-whelans-jan-2026",
      artist: "The Murder Capital", venue: "Whelan's", city: "Dublin",
      eventDate: new Date("2026-01-18"),
      setlist: "Existence, Return My Head, Ethel, Don't Cling to Life",
      body: "Sometimes a small venue gig is exactly what you need. The Murder Capital at Whelan's was sweaty, loud, and brilliant.\n\nJames McGovern commands attention the moment he steps on stage.\n\nDon't Cling to Life remains their masterpiece live. Pure catharsis.\n\nA perfect set from start to finish.",
      status: "PUBLISHED" as const,
      publishedAt: new Date("2026-01-20"),
    },
  ];

  for (const review of reviews) {
    await prisma.review.upsert({
      where: { slug: review.slug },
      update: {},
      create: review,
    });
  }
  console.log(`Created ${reviews.length} sample reviews`);

  // SITE SETTINGS
  const settings = [
    { key: "site_name", value: "Music Site" },
    { key: "site_description", value: "Music news, events and concert reviews" },
    { key: "ticketmaster_country_concerts", value: "IE,GB" },
    { key: "ticketmaster_country_festivals", value: "IE,GB,ES,FR,DE,NL,BE,PT,IT,AT,SE,NO,DK,FI" },
    { key: "rss_poll_interval_minutes", value: "30" },
    { key: "csv_sync_interval_minutes", value: "60" },
  ];

  for (const setting of settings) {
    await prisma.siteSetting.upsert({
      where: { key: setting.key },
      update: { value: setting.value },
      create: setting,
    });
  }
  console.log(`Created ${settings.length} site settings`);

  console.log("\nSeeding complete!");
}

main()
  .then(async () => {
    await pool.end();
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await pool.end();
    await prisma.$disconnect();
    process.exit(1);
  });
