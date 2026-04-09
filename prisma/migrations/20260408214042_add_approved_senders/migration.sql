-- CreateTable
CREATE TABLE "ApprovedSender" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "startMarker" TEXT NOT NULL DEFAULT '===',
    "endMarker" TEXT NOT NULL DEFAULT '******',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "autoPublish" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ApprovedSender_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ApprovedSender_email_key" ON "ApprovedSender"("email");
