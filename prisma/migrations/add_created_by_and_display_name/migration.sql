-- AlterTable
ALTER TABLE "NewsArticle" ADD COLUMN "createdById" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN "displayName" TEXT;

-- AddForeignKey
ALTER TABLE "NewsArticle" ADD CONSTRAINT "NewsArticle_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
