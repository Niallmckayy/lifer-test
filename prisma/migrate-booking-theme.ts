import { createClient } from '@libsql/client'
import * as dotenv from 'dotenv'

dotenv.config()

const statements = [
  `ALTER TABLE "Client" ADD COLUMN "bookingTheme" TEXT NOT NULL DEFAULT '{}'`,
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

  console.log('\nBooking theme migration complete.')
}

main().catch(err => { console.error(err); process.exit(1) })
