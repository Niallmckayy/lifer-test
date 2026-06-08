import { prisma } from '@/lib/prisma'
import { NextRequest } from 'next/server'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS })
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { websiteSlug, type, page, sessionId, duration, referrer } = body

    if (!websiteSlug || !type || !page || !sessionId) {
      return Response.json({}, { status: 200, headers: CORS })
    }

    const website = await prisma.website.findUnique({ where: { slug: websiteSlug }, select: { id: true } })
    if (!website) return Response.json({}, { status: 200, headers: CORS })

    await prisma.analyticsEvent.create({
      data: {
        id: crypto.randomUUID(),
        websiteId: website.id,
        type,
        page,
        sessionId,
        duration: typeof duration === 'number' ? duration : null,
        referrer: referrer || null,
      },
    })
  } catch {
    // fail silently — never break client sites
  }

  return Response.json({}, { status: 200, headers: CORS })
}
