-- CreateEnum
CREATE TYPE "EditorialType" AS ENUM ('FESTIVAL_PREVIEW', 'FESTIVAL_UPDATE', 'FESTIVAL_RECAP', 'CONCERT_REVIEW', 'FEATURE');

-- CreateEnum
CREATE TYPE "PostStatus" AS ENUM ('DRAFT', 'SCHEDULED', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "SocialPlatform" AS ENUM ('TWITTER', 'INSTAGRAM', 'FACEBOOK');

-- CreateEnum
CREATE TYPE "SocialStatus" AS ENUM ('PENDING', 'SENT', 'FAILED');

-- DropForeignKey
ALTER TABLE "Presale" DROP CONSTRAINT "Presale_eventId_fkey";

-- AlterTable
ALTER TABLE "RssFeed" ADD COLUMN     "filterKeywords" TEXT,
ADD COLUMN     "filterMode" TEXT NOT NULL DEFAULT 'none';

-- CreateTable
CREATE TABLE "ContactSubmission" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContactSubmission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EditorialPost" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "type" "EditorialType" NOT NULL,
    "excerpt" TEXT,
    "body" TEXT NOT NULL,
    "coverImage" TEXT,
    "socialImage" TEXT,
    "status" "PostStatus" NOT NULL DEFAULT 'DRAFT',
    "publishedAt" TIMESTAMP(3),
    "showInNews" BOOLEAN NOT NULL DEFAULT false,
    "festivalTag" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EditorialPost_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SocialPost" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "platform" "SocialPlatform" NOT NULL,
    "caption" TEXT NOT NULL,
    "imageUrl" TEXT,
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "sentAt" TIMESTAMP(3),
    "status" "SocialStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SocialPost_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "EditorialPost_slug_key" ON "EditorialPost"("slug");

-- CreateIndex
CREATE INDEX "EditorialPost_type_idx" ON "EditorialPost"("type");

-- CreateIndex
CREATE INDEX "EditorialPost_status_idx" ON "EditorialPost"("status");

-- CreateIndex
CREATE INDEX "EditorialPost_publishedAt_idx" ON "EditorialPost"("publishedAt");

-- CreateIndex
CREATE INDEX "EditorialPost_festivalTag_idx" ON "EditorialPost"("festivalTag");

-- CreateIndex
CREATE INDEX "SocialPost_status_idx" ON "SocialPost"("status");

-- CreateIndex
CREATE INDEX "SocialPost_scheduledAt_idx" ON "SocialPost"("scheduledAt");

-- AddForeignKey
ALTER TABLE "Presale" ADD CONSTRAINT "Presale_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SocialPost" ADD CONSTRAINT "SocialPost_postId_fkey" FOREIGN KEY ("postId") REFERENCES "EditorialPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;
