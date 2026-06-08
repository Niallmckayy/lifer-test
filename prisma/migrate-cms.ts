import { createClient } from '@libsql/client'
import { readFileSync } from 'fs'
import { resolve } from 'path'
import * as dotenv from 'dotenv'

dotenv.config()

async function main() {
  const client = createClient({
    url:       process.env.DATABASE_URL!,
    authToken: process.env.DATABASE_AUTH_TOKEN,
  })

  const sqlPath = resolve(__dirname, 'migrations/20260602_add_cms/migration.sql')
  const sql = readFileSync(sqlPath, 'utf-8')

  const statements = sql
    .split(';')
    .map(s =>
      s.split('\n')
        .filter(line => !line.trim().startsWith('--'))
        .join('\n')
        .trim()
    )
    .filter(s => s.length > 0)

  for (const stmt of statements) {
    try {
      await client.execute(stmt)
      console.log('✓', stmt.slice(0, 80).replace(/\n/g, ' '))
    } catch (err) {
      const msg = (err as Error).message ?? ''
      if (msg.includes('duplicate column name') || msg.includes('already exists')) {
        console.log('~', stmt.slice(0, 80).replace(/\n/g, ' '), '(already applied, skipped)')
      } else {
        throw err
      }
    }
  }

  console.log('\nCMS migration complete.')
}

main().catch(err => { console.error(err); process.exit(1) })
