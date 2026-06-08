import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendBookingReminderEmail, sendBookingFollowUpEmail } from '@/lib/email'

export async function GET(req: NextRequest) {
  const secret = req.headers.get('x-cron-secret') ?? req.nextUrl.searchParams.get('secret')
  if (secret !== process.env.CRON_SECRET) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const now     = new Date()
  const appUrl  = process.env.NEXT_PUBLIC_APP_URL ?? ''
  let reminders = 0
  let followUps = 0

  // ── Reminder emails: startsAt is 23–25h from now, not yet sent ────────────
  const reminderWindow = {
    gte: new Date(now.getTime() + 23 * 60 * 60 * 1000),
    lte: new Date(now.getTime() + 25 * 60 * 60 * 1000),
  }

  const upcomingBookings = await prisma.booking.findMany({
    where: {
      status:        'CONFIRMED',
      reminderSentAt: null,
      startsAt:       reminderWindow,
    },
    include: {
      resource: { select: { name: true, timezone: true, meetingType: true, location: true, sendReminders: true } },
      client:   { include: { website: { select: { slug: true } } } },
    },
  })

  for (const booking of upcomingBookings) {
    if (!booking.resource.sendReminders) continue
    try {
      await sendBookingReminderEmail({
        to:           booking.customerEmail,
        customerName: booking.customerName,
        resourceName: booking.resource.name,
        clientName:   booking.client.name,
        startsAt:     booking.startsAt,
        endsAt:       booking.endsAt,
        timezone:     booking.resource.timezone,
        cancelToken:  booking.cancelToken!,
        appUrl,
        meetingType:  booking.resource.meetingType,
        location:     booking.resource.location ?? undefined,
        meetLink:     booking.meetLink ?? undefined,
      })
      await prisma.booking.update({ where: { id: booking.id }, data: { reminderSentAt: now } })
      reminders++
    } catch (err) {
      console.error(`Reminder failed for booking ${booking.id}:`, err)
    }
  }

  // ── Follow-up emails: endsAt was 1–3h ago, not yet sent ──────────────────
  const followUpWindow = {
    gte: new Date(now.getTime() - 3 * 60 * 60 * 1000),
    lte: new Date(now.getTime() - 1 * 60 * 60 * 1000),
  }

  const recentBookings = await prisma.booking.findMany({
    where: {
      status:        'CONFIRMED',
      followUpSentAt: null,
      endsAt:         followUpWindow,
    },
    include: {
      resource: { select: { name: true, sendFollowUp: true } },
      client:   { include: { website: { select: { slug: true } } } },
    },
  })

  for (const booking of recentBookings) {
    if (!booking.resource.sendFollowUp) continue
    const slug       = booking.client.website?.slug
    const bookingUrl = slug ? `${appUrl}/book/${slug}` : appUrl
    try {
      await sendBookingFollowUpEmail({
        to:           booking.customerEmail,
        customerName: booking.customerName,
        resourceName: booking.resource.name,
        clientName:   booking.client.name,
        bookingUrl,
      })
      await prisma.booking.update({ where: { id: booking.id }, data: { followUpSentAt: now } })
      followUps++
    } catch (err) {
      console.error(`Follow-up failed for booking ${booking.id}:`, err)
    }
  }

  return Response.json({ ok: true, reminders, followUps })
}
