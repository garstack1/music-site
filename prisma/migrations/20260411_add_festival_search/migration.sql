-- Add WEB_SCRAPE to EventSource enum
ALTER TYPE "EventSource" ADD VALUE 'WEB_SCRAPE';

-- CreateTable
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
