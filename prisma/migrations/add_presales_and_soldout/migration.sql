-- AlterTable
ALTER TABLE "Event" ADD COLUMN "soldOut" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
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

-- CreateIndex
CREATE INDEX "Presale_eventId_idx" ON "Presale"("eventId");

-- AddForeignKey
ALTER TABLE "Presale" ADD CONSTRAINT "Presale_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE;
