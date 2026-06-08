import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { buildICalFeed } from '@/lib/ical'

export const dynamic = 'force-dynamic'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params
  const token = req.nextUrl.searchParams.get('token')

  const website = await prisma.website.findUnique({
    where: { slug },
    include: { client: { select: { id: true, name: true, calendarToken: true } } },
  })

  if (!website || !website.client) {
    return new NextResponse('Not found', { status: 404 })
  }

  if (!website.client.calendarToken || website.client.calendarToken !== token) {
    return new NextResponse('Unauthorised', { status: 401 })
  }

  const bookings = await prisma.booking.findMany({
    where: {
      clientId: website.client.id,
      status: 'CONFIRMED',
      startsAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
    },
    include: { resource: { select: { name: true } } },
    orderBy: { startsAt: 'asc' },
    take: 500,
  })

  const feed = buildICalFeed(
    website.client.name,
    bookings.map(b => ({
      id:            b.id,
      startsAt:      b.startsAt,
      endsAt:        b.endsAt,
      customerName:  b.customerName,
      resourceName:  b.resource.name,
      notes:         b.notes,
      customerPhone: b.customerPhone,
    })),
  )

  return new NextResponse(feed, {
    headers: {
      'Content-Type':        'text/calendar; charset=utf-8',
      'Content-Disposition': `attachment; filename="${slug}-bookings.ics"`,
      'Cache-Control':       'no-store',
    },
  })
}
