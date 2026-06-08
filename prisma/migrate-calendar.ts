import { createClient } from '@libsql/client'
import * as dotenv from 'dotenv'

dotenv.config()

async function main() {
  const client = createClient({
    url:       process.env.DATABASE_URL!,
    authToken: process.env.DATABASE_AUTH_TOKEN,
  })

  const statements = [
    `ALTER TABLE "Booking" ADD COLUMN "calendarEventId" TEXT`,
    `CREATE TABLE IF NOT EXISTS "CalendarConnection" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "clientId" TEXT NOT NULL,
      "provider" TEXT NOT NULL,
      "accessToken" TEXT NOT NULL,
      "refreshToken" TEXT NOT NULL,
      "expiresAt" DATETIME NOT NULL,
      "calendarId" TEXT NOT NULL DEFAULT 'primary',
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "CalendarConnection_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client" ("id") ON DELETE CASCADE ON UPDATE CASCADE
    )`,
    `CREATE UNIQUE INDEX IF NOT EXISTS "CalendarConnection_clientId_key" ON "CalendarConnection"("clientId")`,
  ]

  for (const stmt of statements) {
    try {
      await client.execute(stmt)
      console.log('✓', stmt.slice(0, 80).replace(/\n/g, ' ').trim())
    } catch (err) {
      const msg = (err as Error).message ?? ''
      if (msg.includes('duplicate column name') || msg.includes('already exists')) {
        console.log('~', stmt.slice(0, 80).replace(/\n/g, ' ').trim(), '(already applied, skipped)')
      } else {
        throw err
      }
    }
  }

  console.log('\nMigration complete.')
}

main().catch(err => { console.error(err); process.exit(1) })
