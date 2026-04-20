-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Website" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "liveVersionId" TEXT,
    "draftVersionId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Website_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Website_liveVersionId_fkey" FOREIGN KEY ("liveVersionId") REFERENCES "Version" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Website_draftVersionId_fkey" FOREIGN KEY ("draftVersionId") REFERENCES "Version" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Website" ("clientId", "createdAt", "draftVersionId", "id", "liveVersionId", "name", "slug") SELECT "clientId", "createdAt", "draftVersionId", "id", "liveVersionId", "name", "slug" FROM "Website";
DROP TABLE "Website";
ALTER TABLE "new_Website" RENAME TO "Website";
CREATE UNIQUE INDEX "Website_slug_key" ON "Website"("slug");
CREATE UNIQUE INDEX "Website_clientId_key" ON "Website"("clientId");
CREATE UNIQUE INDEX "Website_liveVersionId_key" ON "Website"("liveVersionId");
CREATE UNIQUE INDEX "Website_draftVersionId_key" ON "Website"("draftVersionId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
