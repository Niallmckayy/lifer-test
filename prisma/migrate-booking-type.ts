import { createClient } from '@libsql/client'
import * as dotenv from 'dotenv'

dotenv.config()

const statements = [
  `ALTER TABLE "BookingResource" ADD COLUMN "meetingType" TEXT NOT NULL DEFAULT 'in_person'`,
  `ALTER TABLE "BookingResource" ADD COLUMN "location" TEXT`,
  `ALTER TABLE "BookingResource" ADD COLUMN "sendReminders" INTEGER NOT NULL DEFAULT 1`,
  `ALTER TABLE "BookingResource" ADD COLUMN "sendFollowUp" INTEGER NOT NULL DEFAULT 0`,
  `ALTER TABLE "Booking" ADD COLUMN "meetLink" TEXT`,
  `ALTER TABLE "Booking" ADD COLUMN "reminderSentAt" DATETIME`,
  `ALTER TABLE "Booking" ADD COLUMN "followUpSentAt" DATETIME`,
]

async function main() {
  const client = createClient({
    url:       process.env.DATABASE_URL!,
    authToken: process.env.DATABASE_AUTH_TOKEN,
  })

  for (const stmt of statements) {
    try {
      await client.execute(stmt)
      console.log('✓', stmt.slice(0, 80))
    } catch (err) {
      const msg = (err as Error).message ?? ''
      if (msg.includes('duplicate column name') || msg.includes('already exists')) {
        console.log('~', stmt.slice(0, 80), '(already applied, skipped)')
      } else {
        throw err
      }
    }
  }

  console.log('\nBooking type migration complete.')
}

main().catch(err => { console.error(err); process.exit(1) })
