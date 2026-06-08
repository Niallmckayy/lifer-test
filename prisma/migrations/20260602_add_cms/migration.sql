-- Add CMS fields to Website table
ALTER TABLE "Website" ADD COLUMN "cmsSchema" TEXT;
ALTER TABLE "Website" ADD COLUMN "revalidateHook" TEXT;

-- Create SiteContent table
CREATE TABLE "SiteContent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "websiteId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "draft" TEXT,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SiteContent_websiteId_fkey" FOREIGN KEY ("websiteId") REFERENCES "Website" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- Create unique index on websiteId (one-to-one relation)
CREATE UNIQUE INDEX "SiteContent_websiteId_key" ON "SiteContent"("websiteId");
