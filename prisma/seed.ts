// Must be first: load .env before any Prisma/libsql modules read process.env
import { config } from 'dotenv'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
config({ path: resolve(__dirname, '../.env') })

if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = 'file:./dev.db'
}

import { PrismaLibSql } from '@prisma/adapter-libsql'
import { PrismaClient } from '../lib/generated/prisma/client'
import bcrypt from 'bcryptjs'

const adapter = new PrismaLibSql({ url: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter })

async function seedClient({
  email,
  password,
  clientName,
  plan,
  slug,
  previewUrl,
  headline,
  subheading,
  about,
  services,
}: {
  email: string
  password: string
  clientName: string
  plan: string
  slug: string
  previewUrl: string
  headline: string
  subheading: string
  about: string
  services: string[]
}) {
  const hashed = await bcrypt.hash(password, 10)
  const user = await prisma.user.upsert({
    where: { email },
    update: {},
    create: { email, password: hashed, role: 'CUSTOMER' },
  })

  const existing = await prisma.client.findUnique({ where: { userId: user.id } })

  if (!existing) {
    const version = await prisma.version.create({
      data: {
        headline,
        subheading,
        about,
        services: JSON.stringify(services),
        website: {
          create: {
            name: clientName,
            slug,
            previewUrl,
            client: {
              create: {
                name: clientName,
                plan,
                status: 'Active',
                requestLimit: 10,
                userId: user.id,
              },
            },
          },
        },
      },
      include: { website: true },
    })

    await prisma.website.update({
      where: { id: version.website.id },
      data: { liveVersionId: version.id },
    })

    console.log(`Created client: ${clientName}, slug: ${slug}`)
  } else {
    // Update previewUrl if already exists
    await prisma.website.updateMany({
      where: { clientId: existing.id },
      data: { previewUrl },
    })
    console.log(`Client already exists — updated previewUrl for ${clientName}`)
  }
}

async function main() {
  console.log('Seeding database…')

  // ── Admin (dev only) ──────────────────────────────────
  const adminEmail    = process.env.ADMIN_EMAIL    ?? 'admin@example.com'
  const adminPassword = process.env.ADMIN_PASSWORD ?? 'admin123'
  const hashed = await bcrypt.hash(adminPassword, 10)
  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: { email: adminEmail, password: hashed, role: 'ADMIN' },
  })

  // ── Demo client (dev only) ────────────────────────────
  if (process.env.NODE_ENV !== 'production') {
    await seedClient({
      email:      'demo@example.com',
      password:   'demo123',
      clientName: 'Demo Client',
      plan:       'Studio',
      slug:       'demo-client',
      previewUrl: '',
      headline:   'Welcome to Demo Client',
      subheading: 'This is a demo account for development.',
      about:      'Demo client for local development and testing.',
      services:   ['Service 1', 'Service 2', 'Service 3'],
    })
  }

  console.log('\nSeed complete.')
  console.log(`\n  Admin: ${adminEmail} / ${adminPassword}`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
