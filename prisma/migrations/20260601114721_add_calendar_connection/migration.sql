/*
  Warnings:

  - You are about to alter the column `active` on the `BookingResource` table. The data in that column could be lost. The data in that column will be cast from `Int` to `Boolean`.

*/
-- DropIndex
DROP INDEX "Booking_clientId_idx";

-- DropIndex
DROP INDEX "Booking_resourceId_startsAt_idx";

-- DropIndex
DROP INDEX "BookingAvailability_resourceId_idx";

-- AlterTable
ALTER TABLE "Booking" ADD COLUMN "calendarEventId" TEXT;

-- CreateTable
CREATE TABLE "CalendarConnection" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "clientId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "accessToken" TEXT NOT NULL,
    "refreshToken" TEXT NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    "calendarId" TEXT NOT NULL DEFAULT 'primary',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CalendarConnection_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_BookingResource" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "clientId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "slotDuration" INTEGER NOT NULL,
    "bufferTime" INTEGER NOT NULL DEFAULT 0,
    "maxCapacity" INTEGER NOT NULL DEFAULT 1,
    "timezone" TEXT NOT NULL DEFAULT 'Europe/London',
    "color" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "BookingResource_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_BookingResource" ("active", "bufferTime", "clientId", "color", "createdAt", "description", "id", "maxCapacity", "name", "slotDuration", "timezone") SELECT "active", "bufferTime", "clientId", "color", "createdAt", "description", "id", "maxCapacity", "name", "slotDuration", "timezone" FROM "BookingResource";
DROP TABLE "BookingResource";
ALTER TABLE "new_BookingResource" RENAME TO "BookingResource";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "CalendarConnection_clientId_key" ON "CalendarConnection"("clientId");
