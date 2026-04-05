-- CreateTable
CREATE TABLE "TicketClick" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TicketClick_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TicketClick_eventId_idx" ON "TicketClick"("eventId");

-- CreateIndex
CREATE INDEX "TicketClick_createdAt_idx" ON "TicketClick"("createdAt");

-- AddForeignKey
ALTER TABLE "TicketClick" ADD CONSTRAINT "TicketClick_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;
