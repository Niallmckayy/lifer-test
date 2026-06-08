import { createClient } from '@libsql/client'
import * as dotenv from 'dotenv'

dotenv.config()

const statements = [
  `CREATE TABLE IF NOT EXISTS "AnalyticsEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "websiteId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "page" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "duration" INTEGER,
    "referrer" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AnalyticsEvent_websiteId_fkey" FOREIGN KEY ("websiteId") REFERENCES "Website" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
  )`,
  `CREATE INDEX IF NOT EXISTS "AnalyticsEvent_websiteId_idx" ON "AnalyticsEvent"("websiteId")`,
  `CREATE INDEX IF NOT EXISTS "AnalyticsEvent_createdAt_idx" ON "AnalyticsEvent"("createdAt")`,
]

async function main() {
  const client = createClient({
    url:       process.env.DATABASE_URL!,
    authToken: process.env.DATABASE_AUTH_TOKEN,
  })

  for (const stmt of statements) {
    try {
      await client.execute(stmt)
      console.log('✓', stmt.trim().slice(0, 80).replace(/\n/g, ' '))
    } catch (err) {
      const msg = (err as Error).message ?? ''
      if (msg.includes('already exists')) {
        console.log('~', stmt.trim().slice(0, 80).replace(/\n/g, ' '), '(already applied, skipped)')
      } else {
        throw err
      }
    }
  }

  console.log('\nAnalytics migration complete.')
}

main().catch(err => { console.error(err); process.exit(1) })
