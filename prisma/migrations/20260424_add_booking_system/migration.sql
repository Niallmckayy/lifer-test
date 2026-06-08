-- Drop old inadequate tables if they exist from a previous reverted migration
DROP TABLE IF EXISTS "Booking";
DROP TABLE IF EXISTS "RecoveryUnit";

-- Add calendarToken to Client
ALTER TABLE "Client" ADD COLUMN "calendarToken" TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS "Client_calendarToken_key" ON "Client"("calendarToken");

-- CreateTable BookingResource
CREATE TABLE "BookingResource" (
    "id"           TEXT     NOT NULL PRIMARY KEY,
    "clientId"     TEXT     NOT NULL,
    "name"         TEXT     NOT NULL,
    "description"  TEXT,
    "slotDuration" INTEGER  NOT NULL,
    "bufferTime"   INTEGER  NOT NULL DEFAULT 0,
    "maxCapacity"  INTEGER  NOT NULL DEFAULT 1,
    "timezone"     TEXT     NOT NULL DEFAULT 'Europe/London',
    "color"        TEXT,
    "active"       INTEGER  NOT NULL DEFAULT 1,
    "createdAt"    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "BookingResource_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable BookingAvailability
CREATE TABLE "BookingAvailability" (
    "id"         TEXT     NOT NULL PRIMARY KEY,
    "resourceId" TEXT     NOT NULL,
    "dayOfWeek"  INTEGER  NOT NULL,
    "startTime"  TEXT     NOT NULL,
    "endTime"    TEXT     NOT NULL,
    "createdAt"  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "BookingAvailability_resourceId_fkey" FOREIGN KEY ("resourceId") REFERENCES "BookingResource" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable Booking
CREATE TABLE "Booking" (
    "id"            TEXT     NOT NULL PRIMARY KEY,
    "resourceId"    TEXT     NOT NULL,
    "clientId"      TEXT     NOT NULL,
    "startsAt"      DATETIME NOT NULL,
    "endsAt"        DATETIME NOT NULL,
    "customerName"  TEXT     NOT NULL,
    "customerEmail" TEXT     NOT NULL,
    "customerPhone" TEXT,
    "notes"         TEXT,
    "status"        TEXT     NOT NULL DEFAULT 'CONFIRMED',
    "cancelToken"   TEXT,
    "createdAt"     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Booking_resourceId_fkey" FOREIGN KEY ("resourceId") REFERENCES "BookingResource" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Booking_clientId_fkey"   FOREIGN KEY ("clientId")   REFERENCES "Client"          ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- Indexes
CREATE INDEX "BookingResource_clientId_idx"        ON "BookingResource"("clientId");
CREATE INDEX "BookingAvailability_resourceId_idx"  ON "BookingAvailability"("resourceId");
CREATE INDEX "Booking_resourceId_startsAt_idx"     ON "Booking"("resourceId", "startsAt");
CREATE INDEX "Booking_clientId_idx"                ON "Booking"("clientId");
CREATE UNIQUE INDEX "Booking_cancelToken_key"      ON "Booking"("cancelToken");
