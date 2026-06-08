import { createClient } from '@libsql/client'
import * as dotenv from 'dotenv'

dotenv.config()

// ── Config ────────────────────────────────────────────────────
// Set APPLY=true to actually write the changes, otherwise just prints current state.
const APPLY = process.env.APPLY === 'true'

// The broken slug (whatever is currently in the DB) and what it should be
const BROKEN_SLUG  = process.env.BROKEN_SLUG  ?? ''   // e.g. "https://reset-recovery.vercel.app/"
const CORRECT_SLUG = process.env.CORRECT_SLUG ?? ''   // e.g. "reset-recovery"
const PREVIEW_URL  = process.env.PREVIEW_URL  ?? ''   // e.g. "https://reset-recovery.vercel.app/"
// ─────────────────────────────────────────────────────────────

async function main() {
  const db = createClient({
    url:       process.env.DATABASE_URL!,
    authToken: process.env.DATABASE_AUTH_TOKEN,
  })

  // Always print current website rows so you can confirm before applying
  const rows = await db.execute(`SELECT id, name, slug, previewUrl FROM "Website" ORDER BY createdAt DESC`)
  console.log('\nCurrent websites:')
  for (const row of rows.rows) {
    console.log(`  id=${row.id}  slug=${row.slug}  previewUrl=${row.previewUrl ?? '(none)'}  name=${row.name}`)
  }

  if (!APPLY) {
    console.log('\nDry run — set APPLY=true to apply changes.')
    console.log('Also set BROKEN_SLUG, CORRECT_SLUG, and PREVIEW_URL env vars.')
    return
  }

  if (!BROKEN_SLUG || !CORRECT_SLUG || !PREVIEW_URL) {
    console.error('\nError: BROKEN_SLUG, CORRECT_SLUG, and PREVIEW_URL must all be set when APPLY=true')
    process.exit(1)
  }

  await db.execute({
    sql: `UPDATE "Website" SET slug = ?, previewUrl = ? WHERE slug = ?`,
    args: [CORRECT_SLUG, PREVIEW_URL, BROKEN_SLUG],
  })

  console.log(`\n✓ Updated slug "${BROKEN_SLUG}" → "${CORRECT_SLUG}", previewUrl → "${PREVIEW_URL}"`)
}

main().catch(err => { console.error(err); process.exit(1) })
