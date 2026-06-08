import { prisma } from '@/lib/prisma'
import { createGoogleEvent, deleteGoogleEvent } from '@/lib/calendar-google'
import { createOutlookEvent, deleteOutlookEvent } from '@/lib/calendar-outlook'

interface BookingForSync {
  id:            string
  clientId:      string
  startsAt:      Date
  endsAt:        Date
  customerName:  string
  customerEmail: string
  notes:         string | null
  resource: {
    name:        string
    timezone:    string
    meetingType: string
    location:    string | null
    client: {
      name: string
    }
  }
}

export async function pushBookingToCalendar(booking: BookingForSync): Promise<string | null> {
  const conn = await prisma.calendarConnection.findUnique({ where: { clientId: booking.clientId } })
  if (!conn) return null

  const event = {
    bookingId:     booking.id,
    title:         `${booking.resource.name} — ${booking.customerName}`,
    description:   [
      `Customer: ${booking.customerName}`,
      `Email: ${booking.customerEmail}`,
      booking.notes ? `Notes: ${booking.notes}` : '',
    ].filter(Boolean).join('\n'),
    startsAt:      booking.startsAt,
    endsAt:        booking.endsAt,
    timezone:      booking.resource.timezone,
    attendeeEmail: booking.customerEmail,
    attendeeName:  booking.customerName,
    meetingType:   booking.resource.meetingType,
    location:      booking.resource.location,
  }

  let eventId: string | null = null
  let meetLink: string | null = null

  if (conn.provider === 'google') {
    const result = await createGoogleEvent(booking.clientId, event)
    eventId  = result?.eventId  ?? null
    meetLink = result?.meetLink ?? null
  } else if (conn.provider === 'outlook') {
    eventId = await createOutlookEvent(booking.clientId, event)
  }

  if (eventId) {
    await prisma.booking.update({
      where: { id: booking.id },
      data:  {
        calendarEventId: eventId,
        ...(meetLink ? { meetLink } : {}),
      },
    })
  }

  return meetLink
}

export async function removeBookingFromCalendar(bookingId: string, clientId: string): Promise<void> {
  const booking = await prisma.booking.findUnique({ where: { id: bookingId }, select: { calendarEventId: true } })
  if (!booking?.calendarEventId) return

  const conn = await prisma.calendarConnection.findUnique({ where: { clientId } })
  if (!conn) return

  if (conn.provider === 'google') {
    await deleteGoogleEvent(clientId, booking.calendarEventId)
  } else if (conn.provider === 'outlook') {
    await deleteOutlookEvent(clientId, booking.calendarEventId)
  }
}
