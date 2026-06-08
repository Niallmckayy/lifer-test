import { NextRequest } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { generatePassword } from '@/lib/generate-password'
import type { CmsSchema, CmsContent } from '@/types/cms'

type OnboardBody = {
  name: string
  email: string
  plan: string
  websiteName: string
  slug: string
  schema: CmsSchema
  content: CmsContent
  previewUrl?: string
}

export async function POST(req: NextRequest) {
  const secret = req.headers.get('x-admin-secret')
  if (!secret || secret !== process.env.ADMIN_API_SECRET) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: OnboardBody
  try {
    body = await req.json()
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { name, email, plan, websiteName, slug, schema, content, previewUrl } = body

  if (!name || !email || !plan || !websiteName || !slug || !schema || !content) {
    return Response.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const existingUser = await prisma.user.findUnique({ where: { email } })
  if (existingUser) {
    return Response.json({ error: 'A user with that email already exists.' }, { status: 409 })
  }

  const existingSlug = await prisma.website.findUnique({ where: { slug } })
  if (existingSlug) {
    return Response.json({ error: 'That slug is already taken.' }, { status: 409 })
  }

  const tempPassword = generatePassword()
  const hashedPassword = await bcrypt.hash(tempPassword, 10)

  let websiteId: string
  let userId: string

  try {
    await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: { email, password: hashedPassword, role: 'CUSTOMER' },
      })
      userId = user.id

      const client = await tx.client.create({
        data: { name, plan, status: 'Active', requestLimit: 10, userId: user.id },
      })

      const website = await tx.website.create({
        data: {
          name: websiteName,
          slug,
          clientId: client.id,
          cmsSchema: JSON.stringify(schema),
          ...(previewUrl ? { previewUrl } : {}),
        },
      })
      websiteId = website.id

      const version = await tx.version.create({
        data: {
          headline: `Welcome to ${name}`,
          subheading: 'We deliver exceptional work for every client.',
          about: `${name} is committed to craft and quality.`,
          services: JSON.stringify(['Service 1', 'Service 2', 'Service 3']),
          websiteId: website.id,
        },
      })

      await tx.website.update({
        where: { id: website.id },
        data: { liveVersionId: version.id },
      })

      await tx.siteContent.create({
        data: { websiteId: website.id, content: JSON.stringify(content) },
      })
    })
  } catch (err) {
    console.error('[onboard]', err)
    return Response.json({ error: 'Internal error' }, { status: 500 })
  }

  return Response.json({ websiteId: websiteId!, userId: userId!, tempPassword, slug })
}
