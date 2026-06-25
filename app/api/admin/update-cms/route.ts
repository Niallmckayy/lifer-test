import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import type { CmsSchema, CmsContent } from '@/types/cms'

type UpdateBody = {
  slug: string
  schema: CmsSchema
  content: CmsContent
}

export async function POST(req: NextRequest) {
  const secret = req.headers.get('x-admin-secret')
  if (!secret || secret !== process.env.ADMIN_API_SECRET) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: UpdateBody
  try {
    body = await req.json()
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { slug, schema, content } = body
  if (!slug || !schema || !content) {
    return Response.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const website = await prisma.website.findUnique({ where: { slug } })
  if (!website) {
    return Response.json({ error: 'Website not found' }, { status: 404 })
  }

  await prisma.website.update({
    where: { slug },
    data: { cmsSchema: JSON.stringify(schema) },
  })

  await prisma.siteContent.upsert({
    where: { websiteId: website.id },
    update: { content: JSON.stringify(content) },
    create: { websiteId: website.id, content: JSON.stringify(content) },
  })

  return Response.json({ ok: true, slug })
}
