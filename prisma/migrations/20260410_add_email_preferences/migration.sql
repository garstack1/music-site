-- CreateEnum
CREATE TYPE "EmailFrequency" AS ENUM ('NONE', 'DAILY', 'WEEKLY', 'MONTHLY');

-- CreateTable
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

-- CreateIndex
CREATE UNIQUE INDEX "EmailPreferences_userId_key" ON "EmailPreferences"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "EmailPreferences_unsubscribeToken_key" ON "EmailPreferences"("unsubscribeToken");

-- CreateIndex
CREATE INDEX "EmailPreferences_frequency_idx" ON "EmailPreferences"("frequency");

-- CreateIndex
CREATE INDEX "EmailPreferences_lastSentAt_idx" ON "EmailPreferences"("lastSentAt");

-- AddForeignKey
ALTER TABLE "EmailPreferences" ADD CONSTRAINT "EmailPreferences_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
