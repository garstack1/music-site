-- Add gallery and SEO fields to EditorialPost
ALTER TABLE "EditorialPost" ADD COLUMN IF NOT EXISTS "galleryStyle" TEXT NOT NULL DEFAULT 'MASONRY';
ALTER TABLE "EditorialPost" ADD COLUMN IF NOT EXISTS "galleryArtist" TEXT;
ALTER TABLE "EditorialPost" ADD COLUMN IF NOT EXISTS "galleryVenue" TEXT;
ALTER TABLE "EditorialPost" ADD COLUMN IF NOT EXISTS "galleryEvent" TEXT;

-- Create GalleryStyle enum if not exists
DO $$ BEGIN
  CREATE TYPE "GalleryStyle" AS ENUM ('MASONRY', 'GRID', 'SLIDESHOW');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create GalleryImage table
CREATE TABLE IF NOT EXISTS "GalleryImage" (
  "id" TEXT NOT NULL,
  "postId" TEXT NOT NULL,
  "url" TEXT NOT NULL,
  "caption" TEXT,
  "altText" TEXT,
  "tags" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "shutterSpeed" TEXT,
  "aperture" TEXT,
  "iso" TEXT,
  "order" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "GalleryImage_pkey" PRIMARY KEY ("id")
);

-- Add foreign key
ALTER TABLE "GalleryImage" ADD CONSTRAINT "GalleryImage_postId_fkey" 
  FOREIGN KEY ("postId") REFERENCES "EditorialPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Add indexes
CREATE INDEX IF NOT EXISTS "GalleryImage_postId_idx" ON "GalleryImage"("postId");
CREATE INDEX IF NOT EXISTS "GalleryImage_order_idx" ON "GalleryImage"("order");
