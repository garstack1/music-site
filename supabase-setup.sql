-- Music Site Database Schema for Supabase
-- Copy and paste this entire file into Supabase SQL Editor and click "Run"

-- Create ENUM types
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'PUBLIC');
CREATE TYPE "EmailFrequency" AS ENUM ('NONE', 'DAILY', 'WEEKLY', 'MONTHLY');
CREATE TYPE "EventType" AS ENUM ('CONCERT', 'FESTIVAL');
CREATE TYPE "EventSource" AS ENUM ('TICKETMASTER', 'CSV', 'MANUAL', 'WEB_SCRAPE');
CREATE TYPE "ReviewStatus" AS ENUM ('DRAFT', 'PUBLISHED');

-- Users
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "displayName" TEXT,
    "passwordHash" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'PUBLIC',
    "blocked" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- Email Preferences
CREATE TABLE "EmailPreferences" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "frequency" "EmailFrequency" NOT NULL DEFAULT 'NONE',
    "preferredDay" INTEGER,
    "includeFeatured" BOOLEAN NOT NULL DEFAULT true,
    "includePresale" BOOLEAN NOT NULL DEFAULT true,
    "includeExclusive" BOOLEAN NOT NULL DEFAULT true,
    "includeCompetitions" BOOLEAN NOT NULL DEFAULT true,
    "lastSentAt" TIMESTAMP(3),
    "unsubscribedAt" TIMESTAMP(3),
    "unsubscribeToken" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "EmailPreferences_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "EmailPreferences_userId_key" ON "EmailPreferences"("userId");
CREATE UNIQUE INDEX "EmailPreferences_unsubscribeToken_key" ON "EmailPreferences"("unsubscribeToken");
CREATE INDEX "EmailPreferences_frequency_idx" ON "EmailPreferences"("frequency");
CREATE INDEX "EmailPreferences_lastSentAt_idx" ON "EmailPreferences"("lastSentAt");

-- Events
CREATE TABLE "Event" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "EventType" NOT NULL,
    "artist" TEXT,
    "venue" TEXT,
    "city" TEXT,
    "country" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "ticketUrl" TEXT,
    "affiliateUrl" TEXT,
    "description" TEXT,
    "imageUrl" TEXT,
    "genre" TEXT,
    "subGenre" TEXT,
    "startTime" TEXT,
    "priceMin" DOUBLE PRECISION,
    "priceMax" DOUBLE PRECISION,
    "priceCurrency" TEXT,
    "artistWebsite" TEXT,
    "artistFacebook" TEXT,
    "artistTwitter" TEXT,
    "artistInstagram" TEXT,
    "artistSpotify" TEXT,
    "artistYoutube" TEXT,
    "artistTiktok" TEXT,
    "source" "EventSource" NOT NULL,
    "sourceId" TEXT,
    "fingerprint" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "subscriberOnly" BOOLEAN NOT NULL DEFAULT false,
    "soldOut" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Event_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Event_fingerprint_key" ON "Event"("fingerprint");
CREATE INDEX "Event_date_idx" ON "Event"("date");
CREATE INDEX "Event_country_idx" ON "Event"("country");
CREATE INDEX "Event_type_idx" ON "Event"("type");

-- Presales
CREATE TABLE "Presale" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "url" TEXT,
    "startDateTime" TIMESTAMP(3) NOT NULL,
    "endDateTime" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Presale_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "Presale_eventId_idx" ON "Presale"("eventId");

-- Saved Events
CREATE TABLE "SavedEvent" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SavedEvent_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "SavedEvent_userId_eventId_key" ON "SavedEvent"("userId", "eventId");
CREATE INDEX "SavedEvent_userId_idx" ON "SavedEvent"("userId");

-- Ticket Clicks
CREATE TABLE "TicketClick" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TicketClick_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "TicketClick_eventId_idx" ON "TicketClick"("eventId");
CREATE INDEX "TicketClick_createdAt_idx" ON "TicketClick"("createdAt");

-- RSS Feeds
CREATE TABLE "RssFeed" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "sourceLabel" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "lastPolled" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "RssFeed_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "RssFeed_url_key" ON "RssFeed"("url");

-- News Articles
CREATE TABLE "NewsArticle" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "summary" TEXT,
    "sourceUrl" TEXT NOT NULL,
    "sourceLabel" TEXT,
    "imageUrl" TEXT,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "hidden" BOOLEAN NOT NULL DEFAULT false,
    "manual" BOOLEAN NOT NULL DEFAULT false,
    "body" TEXT,
    "rssFeedId" TEXT,
    "createdById" TEXT,
    "publishedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "NewsArticle_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "NewsArticle_slug_key" ON "NewsArticle"("slug");
CREATE UNIQUE INDEX "NewsArticle_sourceUrl_key" ON "NewsArticle"("sourceUrl");

-- Genres
CREATE TABLE "Genre" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    CONSTRAINT "Genre_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Genre_name_key" ON "Genre"("name");
CREATE UNIQUE INDEX "Genre_slug_key" ON "Genre"("slug");

-- Article Tags
CREATE TABLE "ArticleTag" (
    "id" TEXT NOT NULL,
    "articleId" TEXT NOT NULL,
    "genreId" TEXT NOT NULL,
    CONSTRAINT "ArticleTag_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "ArticleTag_articleId_genreId_key" ON "ArticleTag"("articleId", "genreId");

-- Approved Senders (Email)
CREATE TABLE "ApprovedSender" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "startMarker" TEXT NOT NULL DEFAULT '===',
    "endMarker" TEXT NOT NULL DEFAULT '******',
    "sourceLabel" TEXT,
    "gmailLabel" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "autoPublish" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ApprovedSender_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "ApprovedSender_email_key" ON "ApprovedSender"("email");

-- Processed Emails
CREATE TABLE "ProcessedEmail" (
    "id" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "sender" TEXT NOT NULL,
    "subject" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ProcessedEmail_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "ProcessedEmail_messageId_key" ON "ProcessedEmail"("messageId");

-- CSV Sources
CREATE TABLE "CsvSource" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "autoPublish" BOOLEAN NOT NULL DEFAULT true,
    "lastPolled" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CsvSource_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "CsvSource_url_key" ON "CsvSource"("url");

-- Competitions
CREATE TABLE "Competition" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "prize" TEXT NOT NULL,
    "prizeType" TEXT NOT NULL DEFAULT 'TICKETS',
    "imageUrl" TEXT,
    "rules" TEXT,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "maxEntries" INTEGER,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "winnerId" TEXT,
    "winnerPhoto" TEXT,
    "winnerComment" TEXT,
    "prizeReleased" BOOLEAN NOT NULL DEFAULT false,
    "drawnAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Competition_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Competition_slug_key" ON "Competition"("slug");
CREATE INDEX "Competition_startDate_idx" ON "Competition"("startDate");
CREATE INDEX "Competition_endDate_idx" ON "Competition"("endDate");

-- Competition Entries
CREATE TABLE "CompetitionEntry" (
    "id" TEXT NOT NULL,
    "competitionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "agreedToTerms" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CompetitionEntry_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "CompetitionEntry_competitionId_userId_key" ON "CompetitionEntry"("competitionId", "userId");

-- Reviews
CREATE TABLE "Review" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "artist" TEXT NOT NULL,
    "venue" TEXT NOT NULL,
    "city" TEXT,
    "eventDate" TIMESTAMP(3) NOT NULL,
    "setlist" TEXT,
    "body" TEXT NOT NULL,
    "coverImage" TEXT,
    "status" "ReviewStatus" NOT NULL DEFAULT 'DRAFT',
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Review_slug_key" ON "Review"("slug");

-- Review Photos
CREATE TABLE "ReviewPhoto" (
    "id" TEXT NOT NULL,
    "reviewId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "caption" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "ReviewPhoto_pkey" PRIMARY KEY ("id")
);

-- Public Reviews
CREATE TABLE "PublicReview" (
    "id" TEXT NOT NULL,
    "reviewId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "text" TEXT,
    "approved" BOOLEAN NOT NULL DEFAULT true,
    "flagged" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PublicReview_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "PublicReview_reviewId_userId_key" ON "PublicReview"("reviewId", "userId");

-- Site Settings
CREATE TABLE "SiteSetting" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    CONSTRAINT "SiteSetting_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "SiteSetting_key_key" ON "SiteSetting"("key");

-- Import Logs
CREATE TABLE "ImportLog" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "eventsCreated" INTEGER NOT NULL DEFAULT 0,
    "eventsUpdated" INTEGER NOT NULL DEFAULT 0,
    "eventsSkipped" INTEGER NOT NULL DEFAULT 0,
    "errors" TEXT,
    "duration" INTEGER,
    "triggeredBy" TEXT,
    "details" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ImportLog_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "ImportLog_type_idx" ON "ImportLog"("type");
CREATE INDEX "ImportLog_createdAt_idx" ON "ImportLog"("createdAt");

-- Festival Search
CREATE TABLE "FestivalSearch" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "searchQuery" TEXT NOT NULL,
    "region" TEXT,
    "genre" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "lastSearched" TIMESTAMP(3),
    "resultsCount" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "FestivalSearch_pkey" PRIMARY KEY ("id")
);

-- Foreign Keys
ALTER TABLE "EmailPreferences" ADD CONSTRAINT "EmailPreferences_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SavedEvent" ADD CONSTRAINT "SavedEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SavedEvent" ADD CONSTRAINT "SavedEvent_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Presale" ADD CONSTRAINT "Presale_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TicketClick" ADD CONSTRAINT "TicketClick_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "NewsArticle" ADD CONSTRAINT "NewsArticle_rssFeedId_fkey" FOREIGN KEY ("rssFeedId") REFERENCES "RssFeed"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "NewsArticle" ADD CONSTRAINT "NewsArticle_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ArticleTag" ADD CONSTRAINT "ArticleTag_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "NewsArticle"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ArticleTag" ADD CONSTRAINT "ArticleTag_genreId_fkey" FOREIGN KEY ("genreId") REFERENCES "Genre"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Competition" ADD CONSTRAINT "Competition_winnerId_fkey" FOREIGN KEY ("winnerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "CompetitionEntry" ADD CONSTRAINT "CompetitionEntry_competitionId_fkey" FOREIGN KEY ("competitionId") REFERENCES "Competition"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CompetitionEntry" ADD CONSTRAINT "CompetitionEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ReviewPhoto" ADD CONSTRAINT "ReviewPhoto_reviewId_fkey" FOREIGN KEY ("reviewId") REFERENCES "Review"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PublicReview" ADD CONSTRAINT "PublicReview_reviewId_fkey" FOREIGN KEY ("reviewId") REFERENCES "Review"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PublicReview" ADD CONSTRAINT "PublicReview_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
