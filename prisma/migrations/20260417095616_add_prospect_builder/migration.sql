-- CreateTable
CREATE TABLE "Prospect" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "businessName" TEXT NOT NULL,
    "industry" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'GENERATING',
    "deploymentUrl" TEXT,
    "githubRepo" TEXT,
    "vercelProjectId" TEXT,
    "htmlContent" TEXT,
    "prospectEmail" TEXT,
    "notes" TEXT,
    "convertedToClientId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Prospect_convertedToClientId_fkey" FOREIGN KEY ("convertedToClientId") REFERENCES "Client" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Prospect_slug_key" ON "Prospect"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Prospect_convertedToClientId_key" ON "Prospect"("convertedToClientId");
