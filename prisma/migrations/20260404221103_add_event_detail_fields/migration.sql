-- AlterTable
ALTER TABLE "Event" ADD COLUMN     "priceCurrency" TEXT,
ADD COLUMN     "priceMax" DOUBLE PRECISION,
ADD COLUMN     "priceMin" DOUBLE PRECISION,
ADD COLUMN     "startTime" TEXT,
ADD COLUMN     "subGenre" TEXT;
