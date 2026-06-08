import { prisma } from '@/lib/prisma'
import { NextRequest } from 'next/server'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params

  const website = await prisma.website.findUnique({
    where: { slug },
    include: { siteContent: true },
  })

  if (!website?.siteContent?.content) {
    return Response.json({ error: 'Not found' }, { status: 404 })
  }

  const content = JSON.parse(website.siteContent.content)

  return Response.json(content, {
    headers: {
      'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
      'Access-Control-Allow-Origin': '*',
    },
  })
}
